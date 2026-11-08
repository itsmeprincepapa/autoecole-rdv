import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { HoursService } from '../hours/hours.service';
import { HoursMovementType } from '../hours/hours-movement-type.enum';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { SlotsService } from './slots.service';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';

// Délai minimum pour une annulation avec remboursement
const FREE_CANCELLATION_HOURS = 24;

interface Actor {
  id: string;
  role: UserRole;
}

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly slotsService: SlotsService,
    private readonly hoursService: HoursService,
    private readonly mailService: MailService,
  ) {}

  async book(studentId: string, dto: CreateAppointmentDto) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Date invalide');
    }

    // Le créneau demandé doit faire partie des créneaux libres calculés par le serveur
    const date = this.localDate(startsAt);
    const freeSlots = await this.slotsService.getFreeSlots(
      dto.instructorId,
      date,
    );
    const wanted = freeSlots.find(
      (s) => new Date(s.startsAt).getTime() === startsAt.getTime(),
    );
    if (!wanted) {
      throw new ConflictException("Ce créneau n'est plus disponible");
    }
    const endsAt = new Date(wanted.endsAt);

    let result: {
      id: string;
      instructorId: string;
      vehicleId: string;
      startsAt: Date;
      endsAt: Date;
      status: AppointmentStatus;
    };

    try {
      result = await this.dataSource.transaction(async (manager) => {
        const vehicleId = await this.pickFreeVehicle(manager, startsAt, endsAt);

        const appointment = await manager.save(
          manager.create(Appointment, {
            studentId,
            instructorId: dto.instructorId,
            vehicleId,
            startsAt,
            endsAt,
          }),
        );

        // Débit d'une heure (échoue si solde insuffisant : tout est annulé)
        await this.hoursService.applyMovement(manager, {
          studentId,
          createdById: studentId,
          type: HoursMovementType.BOOKING,
          amount: -1,
          reason: 'Réservation de leçon',
          appointmentId: appointment.id,
        });

        return {
          id: appointment.id,
          instructorId: appointment.instructorId,
          vehicleId: appointment.vehicleId,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          status: appointment.status,
        };
      });
    } catch (error) {
      // 23P01 = violation de la contrainte d'exclusion PostgreSQL
      if ((error as { code?: string }).code === '23P01') {
        throw new ConflictException("Ce créneau vient d'être réservé");
      }
      throw error;
    }

    // Email APRÈS la transaction : un échec d'envoi n'annule pas la réservation
    const [student, instructor] = await Promise.all([
      this.dataSource.getRepository(User).findOne({ where: { id: studentId } }),
      this.dataSource
        .getRepository(User)
        .findOne({ where: { id: dto.instructorId } }),
    ]);
    if (student) {
      await this.mailService.sendBookingConfirmation(student.email, {
        startsAt: result.startsAt,
        instructorName: instructor
          ? `${instructor.firstName} ${instructor.lastName}`
          : 'Votre moniteur',
      });
    }

    return result;
  }

  // Annulation : l'élève (les siens) ou le gérant (tous)
  async cancel(actor: Actor, appointmentId: string) {
    const outcome = await this.dataSource.transaction(async (manager) => {
      // Verrou sur la ligne : deux annulations simultanées ne remboursent pas deux fois
      const appointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        lock: { mode: 'pessimistic_write' },
      });

      // Même réponse si le rendez-vous n'existe pas ou n'appartient pas à l'élève
      const notFound = new NotFoundException('Rendez-vous introuvable');
      if (!appointment) throw notFound;
      if (actor.role === UserRole.STUDENT && appointment.studentId !== actor.id) {
        throw notFound;
      }
      if (actor.role !== UserRole.STUDENT && actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException('Ce rendez-vous ne peut plus être annulé');
      }
      if (appointment.startsAt <= new Date()) {
        throw new BadRequestException('Ce rendez-vous est déjà passé');
      }

      // Heures restantes avant la leçon
      const hoursLeft =
        (appointment.startsAt.getTime() - Date.now()) / (60 * 60 * 1000);
      // Le gérant rembourse toujours ; l'élève seulement s'il annule à temps
      const refund =
        actor.role === UserRole.ADMIN || hoursLeft >= FREE_CANCELLATION_HOURS;

      await manager.update(Appointment, appointment.id, {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
      });

      if (refund) {
        await this.hoursService.applyMovement(manager, {
          studentId: appointment.studentId,
          createdById: actor.id,
          type: HoursMovementType.REFUND,
          amount: 1,
          reason:
            actor.role === UserRole.ADMIN
              ? 'Annulation par le gérant'
              : 'Annulation à temps',
          appointmentId: appointment.id,
        });
      }

      return {
        studentId: appointment.studentId,
        startsAt: appointment.startsAt,
        refund,
      };
    });

    // Email APRÈS la transaction
    const student = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: outcome.studentId } });
    if (student) {
      await this.mailService.sendCancellationNotice(student.email, {
        startsAt: outcome.startsAt,
        refunded: outcome.refund,
      });
    }

    return {
      message: outcome.refund
        ? 'Rendez-vous annulé, 1 heure rendue.'
        : "Rendez-vous annulé tardivement, l'heure est perdue.",
      refunded: outcome.refund,
    };
  }

    // Clôture d'une leçon : le moniteur concerné (ou le gérant)
  async complete(actor: Actor, appointmentId: string, dto: CompleteAppointmentDto) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        lock: { mode: 'pessimistic_write' },
      });

      // Même réponse si le rendez-vous n'existe pas ou n'appartient pas au moniteur
      const notFound = new NotFoundException('Rendez-vous introuvable');
      if (!appointment) throw notFound;
      if (
        actor.role === UserRole.INSTRUCTOR &&
        appointment.instructorId !== actor.id
      ) {
        throw notFound;
      }
      if (actor.role !== UserRole.INSTRUCTOR && actor.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }

      if (appointment.status !== AppointmentStatus.CONFIRMED) {
        throw new BadRequestException('Cette leçon est déjà clôturée ou annulée');
      }
      if (appointment.startsAt > new Date()) {
        throw new BadRequestException("Cette leçon n'a pas encore commencé");
      }

      await manager.update(Appointment, appointment.id, {
        status: dto.status,
        notes: dto.notes?.trim() || null,
      });

      return { id: appointment.id, status: dto.status };
    });
  }

   // Rendez-vous de l'élève connecté, avec moniteur et véhicule (sans données privées)
  async mine(studentId: string) {
    const rows = await this.dataSource.getRepository(Appointment).find({
      where: { studentId },
      relations: { instructor: true, vehicle: true },
      order: { startsAt: 'DESC' },
    });

    return rows.map((a) => ({
      id: a.id,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
      status: a.status,
      notes: a.notes,
      instructor: {
        id: a.instructor.id,
        firstName: a.instructor.firstName,
        lastName: a.instructor.lastName,
      },
      vehicle: { plateNumber: a.vehicle.plateNumber, model: a.vehicle.model },
    }));
  }

  // Date locale (AAAA-MM-JJ) de l'auto-école pour un instant donné
  private localDate(at: Date): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: this.slotsService.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  }

  // Premier véhicule disponible sans rendez-vous non annulé sur la plage
  private async pickFreeVehicle(
    manager: EntityManager,
    startsAt: Date,
    endsAt: Date,
  ): Promise<string> {
    const rows: { id: string }[] = await manager.query(
      `SELECT v.id FROM vehicles v
       WHERE v."isAvailable" = true
       AND NOT EXISTS (
         SELECT 1 FROM appointments a
         WHERE a."vehicleId" = v.id
         AND a.status <> 'cancelled'
         AND a."startsAt" < $2 AND a."endsAt" > $1
       )
       ORDER BY v."plateNumber" ASC
       LIMIT 1`,
      [startsAt, endsAt],
    );
    if (rows.length === 0) {
      throw new ConflictException('Aucun véhicule disponible sur ce créneau');
    }
    return rows[0].id;
  }
}