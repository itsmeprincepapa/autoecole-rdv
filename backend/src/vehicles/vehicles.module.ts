import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclePhotosController } from './vehicle-photos.controller';
import { Vehicle } from './vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehiclesController, VehiclePhotosController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}