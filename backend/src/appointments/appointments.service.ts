import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HoursService } from '../hours/hours.service';
import { HoursMovementType } from '../hours/hours-movement-type.enum';
import { Appointment } from './appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { SlotsService } from './slots.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly slotsService: SlotsService,
    private readonly hoursService: HoursService,
  ) {}

  async book(studentId: string, dto: CreateAppointmentDto) {
    const startsAt = new Date(dto.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException('Date invalide');
    }

    // Le créneau demandé doit faire partie des créneaux libres calculés par le serveur
    const date = await this.localDate(startsAt);
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

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Véhicule libre choisi par le serveur
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
      // 23P01 = violation de la contrainte d'exclusion PostgreSQL :
      // quelqu'un a réservé ce créneau entre-temps
      if ((error as { code?: string }).code === '23P01') {
        throw new ConflictException("Ce créneau vient d'être réservé");
      }
      throw error;
    }
  }

  // Date locale (AAAA-MM-JJ) de l'auto-école pour un instant donné
  private async localDate(at: Date): Promise<string> {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.slotsService.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
    return parts; // format AAAA-MM-JJ
  }

  // Premier véhicule disponible sans rendez-vous non annulé sur la plage
  private async pickFreeVehicle(
    manager: import('typeorm').EntityManager,
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