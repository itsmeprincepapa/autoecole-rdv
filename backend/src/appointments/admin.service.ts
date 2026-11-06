import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { Availability } from '../availability/availability.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { localToUtc, SlotsService } from './slots.service';

const DAY_MS = 24 * 60 * 60000;
const MAX_STATS_DAYS = 366;

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(Availability)
    private readonly availabilities: Repository<Availability>,
    private readonly slotsService: SlotsService,
  ) {}

  // Bornes UTC [début, fin[ à partir de dates locales (to inclus)
  private range(from: string, to: string) {
    const tz = this.slotsService.timeZone;
    const start = localToUtc(from, '00:00', tz);
    const end = new Date(localToUtc(to, '00:00', tz).getTime() + DAY_MS);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Dates invalides');
    }
    if (end <= start) throw new BadRequestException('to doit être après from');
    return { start, end };
  }

  async list(query: AdminListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<Appointment> = {};
    if (query.instructorId) where.instructorId = query.instructorId;
    if (query.studentId) where.studentId = query.studentId;
    if (query.status) where.status = query.status;
    if (query.from && query.to) {
      const { start, end } = this.range(query.from, query.to);
      where.startsAt = Between(start, new Date(end.getTime() - 1));
    }

    const [rows, total] = await this.appointments.findAndCount({
      where,
      relations: { student: true, instructor: true, vehicle: true },
      order: { startsAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      total,
      page,
      limit,
      items: rows.map((a) => ({
        id: a.id,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        cancelledAt: a.cancelledAt,
        student: {
          id: a.student.id,
          firstName: a.student.firstName,
          lastName: a.student.lastName,
        },
        instructor: {
          id: a.instructor.id,
          firstName: a.instructor.firstName,
          lastName: a.instructor.lastName,
        },
        vehicle: { plateNumber: a.vehicle.plateNumber, model: a.vehicle.model },
      })),
    };
  }

  async stats(from: string, to: string) {
    const { start, end } = this.range(from, to);
    const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    if (days > MAX_STATS_DAYS) {
      throw new BadRequestException(`Période limitée à ${MAX_STATS_DAYS} jours`);
    }

    // Total par statut
    const byStatusRows: { status: string; count: string }[] =
      await this.appointments
        .createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('a.startsAt >= :start AND a.startsAt < :end', { start, end })
        .groupBy('a.status')
        .getRawMany();
    const byStatus: Record<string, number> = {};
    for (const s of Object.values(AppointmentStatus)) byStatus[s] = 0;
    for (const r of byStatusRows) byStatus[r.status] = Number(r.count);

    // Leçons non annulées par moniteur
    const perInstructor: {
      instructorId: string;
      firstName: string;
      lastName: string;
      lessons: string;
    }[] = await this.appointments
      .createQueryBuilder('a')
      .innerJoin('a.instructor', 'i')
      .select('i.id', 'instructorId')
      .addSelect('i.firstName', 'firstName')
      .addSelect('i.lastName', 'lastName')
      .addSelect('COUNT(*)', 'lessons')
      .where('a.startsAt >= :start AND a.startsAt < :end', { start, end })
      .andWhere('a.status <> :cancelled', {
        cancelled: AppointmentStatus.CANCELLED,
      })
      .groupBy('i.id')
      .addGroupBy('i.firstName')
      .addGroupBy('i.lastName')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    // Créneaux théoriques offerts : heures de disponibilité de chaque jour de la période
    const ranges = await this.availabilities.find();
    const hoursByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const r of ranges) {
      const minutes = toMinutes(r.endTime) - toMinutes(r.startTime);
      hoursByDay[r.dayOfWeek] += Math.floor(minutes / 60);
    }
    const [y, mo, d] = from.split('-').map(Number);
    let offered = 0;
    for (let i = 0; i < days; i++) {
      const dow = new Date(Date.UTC(y, mo - 1, d + i)).getUTCDay();
      offered += hoursByDay[dow];
    }

    const booked =
      byStatus[AppointmentStatus.CONFIRMED] +
      byStatus[AppointmentStatus.COMPLETED] +
      byStatus[AppointmentStatus.NO_SHOW];

    return {
      period: { from, to, days },
      byStatus,
      lessonsPerInstructor: perInstructor.map((r) => ({
        instructorId: r.instructorId,
        name: `${r.firstName} ${r.lastName}`,
        lessons: Number(r.lessons),
      })),
      offeredSlots: offered,
      bookedSlots: booked,
      fillRate: offered > 0 ? Math.round((booked / offered) * 1000) / 10 : 0,
    };
  }
}