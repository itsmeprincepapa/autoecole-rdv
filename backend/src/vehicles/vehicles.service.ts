import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly repo: Repository<Vehicle>,
  ) {}

  findAll(): Promise<Vehicle[]> {
    return this.repo.find({ order: { plateNumber: 'ASC' } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable');
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const plateNumber = dto.plateNumber.toUpperCase().trim();
    const existing = await this.repo.findOne({ where: { plateNumber } });
    if (existing) throw new ConflictException('Cette plaque existe déjà');

    return this.repo.save(
      this.repo.create({ plateNumber, model: dto.model.trim() }),
    );
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.plateNumber !== undefined) {
      const plateNumber = dto.plateNumber.toUpperCase().trim();
      const other = await this.repo.findOne({ where: { plateNumber } });
      if (other && other.id !== id) {
        throw new ConflictException('Cette plaque existe déjà');
      }
      vehicle.plateNumber = plateNumber;
    }
    if (dto.model !== undefined) vehicle.model = dto.model.trim();

    if (dto.isAvailable !== undefined) {
      vehicle.isAvailable = dto.isAvailable;
      // Remis en service : on efface la raison. Bloqué : on garde celle fournie.
      vehicle.unavailableReason = dto.isAvailable
        ? null
        : (dto.unavailableReason ?? null);
    }

    return this.repo.save(vehicle);
  }
}