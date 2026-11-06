import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Not, Repository } from 'typeorm';
import { Availability } from '../availability/availability.entity';
import { UserRole } from '../users/user-role.enum';
import { UsersService } from '../users/users.service';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Appointment } from './appointment.entity';
import { AppointmentStatus } from './appointment-status.enum';

const LESSON_MINUTES = 60;

// Décalage (en minutes) du fuseau par rapport à UTC à un instant donné
function tzOffsetMinutes(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return Math.round((asUtc - at.getTime()) / 60000);
}

// "2026-12-01" + "08:00" en heure locale -> instant UTC (Date)
export function localToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const offset = tzOffsetMinutes(timeZone, guess);
  return new Date(guess.getTime() - offset * 60000);
}

export interface Slot {
  startsAt: string; // ISO UTC
  endsAt: string;
}

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilities: Repository<Availability>,
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(Vehicle)
    private readonly vehicles: Repository<Vehicle>,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  get timeZone(): string {
    return this.config.get<string>('SCHOOL_TIMEZONE') ?? 'Africa/Dakar';
  }

  async getFreeSlots(instructorId: string, date: string): Promise<Slot[]> {
    const instructor = await this.usersService.findById(instructorId);
    if (
      !instructor ||
      instructor.role !== UserRole.INSTRUCTOR ||
      !instructor.isActive
    ) {
      throw new NotFoundException('Moniteur introuvable');
    }

    const tz = this.timeZone;
    const dayStart = localToUtc(date, '00:00', tz);
    if (Number.isNaN(dayStart.getTime())) {
      throw new BadRequestException('Date invalide');
    }
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60000);

    // Jour de la semaine de la date demandée (0 = dimanche)
    const [y, mo, d] = date.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();

    const ranges = await this.availabilities.find({
      where: { instructorId, dayOfWeek },
      order: { startTime: 'ASC' },
    });
    if (ranges.length === 0) return [];

    // Rendez-vous non annulés du jour (moniteur et tous véhicules)
    const dayAppointments = await this.appointments.find({
      where: {
        startsAt: MoreThan(new Date(dayStart.getTime() - 1)),
        status: Not(In([AppointmentStatus.CANCELLED])),
      },
    });
    const todays = dayAppointments.filter((a) => a.startsAt < dayEnd);

    const availableVehicles = await this.vehicles.find({
      where: { isAvailable: true },
    });

    const overlaps = (a: Appointment, start: Date, end: Date) =>
      a.startsAt < end && a.endsAt > start;

    const now = new Date();
    const slots: Slot[] = [];

    for (const range of ranges) {
      const rangeStart = localToUtc(date, range.startTime.slice(0, 5), tz);
      const rangeEnd = localToUtc(date, range.endTime.slice(0, 5), tz);

      for (
        let start = rangeStart;
        start.getTime() + LESSON_MINUTES * 60000 <= rangeEnd.getTime();
        start = new Date(start.getTime() + LESSON_MINUTES * 60000)
      ) {
        const end = new Date(start.getTime() + LESSON_MINUTES * 60000);
        if (start <= now) continue; // pas de créneau dans le passé

        const instructorBusy = todays.some(
          (a) => a.instructorId === instructorId && overlaps(a, start, end),
        );
        if (instructorBusy) continue;

        const freeVehicle = availableVehicles.some(
          (v) =>
            !todays.some((a) => a.vehicleId === v.id && overlaps(a, start, end)),
        );
        if (!freeVehicle) continue;

        slots.push({ startsAt: start.toISOString(), endsAt: end.toISOString() });
      }
    }

    return slots;
  }
}