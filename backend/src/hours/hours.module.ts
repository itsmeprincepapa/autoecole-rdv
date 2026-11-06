import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { HoursController } from './hours.controller';
import { HoursMovement } from './hours-movement.entity';
import { HoursService } from './hours.service';

@Module({
  imports: [TypeOrmModule.forFeature([HoursMovement]), UsersModule],
  controllers: [HoursController],
  providers: [HoursService],
  // Exporté : le service de réservation s'en servira (tâche 51)
  exports: [HoursService],
})
export class HoursModule {}