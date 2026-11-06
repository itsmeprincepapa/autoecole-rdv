import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
import { UserRole } from '../users/user-role.enum';
import { UsersService } from '../users/users.service';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import { localToUtc, SlotsService } from './slots.service';

interface Actor {
  id: string;
  role: UserRole;
}

const MAX_DAYS = 31;

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    private readonly usersService: UsersService,
    private readonly slotsService: SlotsService,
  ) {}

  async getSchedule(
    actor: Actor,
    instructorId: string,
    from: string,
    to: string,
  ) {
    // Un moniteur ne voit que son planning ; le gérant voit tout
    if (actor.role !== UserRole.ADMIN && actor.id !== instructorId) {
      throw new ForbiddenException('Accès refusé');
    }

    const instructor = await this.usersService.findById(instructorId);
    if (!instructor || instructor.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Moniteur introuvable');
    }

    const tz = this.slotsService.timeZone;
    const start = localToUtc(from, '00:00', tz);
    // "to" est inclus : on va jusqu'au début du lendemain
    const end = new Date(localToUtc(to, '00:00', tz).getTime() + 24 * 60 * 60000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Dates invalides');
    }
    if (end <= start) {
      throw new BadRequestException('to doit être après from');
    }
    if ((end.getTime() - start.getTime()) / (24 * 60 * 60000) > MAX_DAYS) {
      throw new BadRequestException(`Période limitée à ${MAX_DAYS} jours`);
    }

    const rows = await this.appointments.find({
      where: {
        instructorId,
        startsAt: Between(start, new Date(end.getTime() - 1)),
        status: Not(AppointmentStatus.CANCELLED),
      },
      relations: { student: true, vehicle: true },
      order: { startsAt: 'ASC' },
    });

    return {
      timeZone: tz,
      appointments: rows.map((a) => ({
        id: a.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        student: {
          id: a.student.id,
          firstName: a.student.firstName,
          lastName: a.student.lastName,
        },
        vehicle: { plateNumber: a.vehicle.plateNumber, model: a.vehicle.model },
      })),
    };
  }
}