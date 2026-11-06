import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from '../availability/availability.entity';
import { HoursModule } from '../hours/hours.module';
import { UsersModule } from '../users/users.module';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Appointment } from './appointment.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Availability, Vehicle]),
    UsersModule,
    HoursModule,
  ],
  controllers: [SlotsController, AppointmentsController],
  providers: [SlotsService, AppointmentsService],
  exports: [TypeOrmModule, SlotsService, AppointmentsService],
})
export class AppointmentsModule {}