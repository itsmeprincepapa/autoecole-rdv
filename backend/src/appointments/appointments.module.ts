import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from '../availability/availability.entity';
import { HoursModule } from '../hours/hours.module';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Availability, Vehicle]),
    UsersModule,
    HoursModule,
    MailModule,
  ],
  controllers: [SlotsController, AppointmentsController, ScheduleController],
  providers: [SlotsService, AppointmentsService, ScheduleService],
  exports: [TypeOrmModule, SlotsService, AppointmentsService],
})
export class AppointmentsModule {}