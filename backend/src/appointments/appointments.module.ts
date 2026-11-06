import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from '../availability/availability.entity';
import { UsersModule } from '../users/users.module';
import { Vehicle } from '../vehicles/vehicle.entity';
import { Appointment } from './appointment.entity';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Availability, Vehicle]),
    UsersModule,
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [TypeOrmModule, SlotsService],
})
export class AppointmentsModule {}