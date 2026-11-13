import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './vehicle.entity';

// Taille maximale d'une photo (vérifiée aussi par le contrôleur)
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Reconnaît le format d'après le CONTENU du fichier (ses premiers octets),
// jamais d'après son nom ni le type déclaré par le navigateur.
function detectMime(buffer: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

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

    return this.repo.save(this.repo.create({ plateNumber, model: dto.model.trim() }));
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
      vehicle.unavailableReason = dto.isAvailable ? null : (dto.unavailableReason ?? null);
    }

    return this.repo.save(vehicle);
  }

  // Enregistre la photo d'un véhicule dans la base (remplace l'ancienne si elle existe)
  async setPhoto(id: string, buffer: Buffer): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    const mime = detectMime(buffer);
    if (!mime) {
      throw new BadRequestException('Format non pris en charge : utilisez JPEG, PNG ou WebP');
    }

    vehicle.photoData = buffer;
    vehicle.photoMime = mime;
    // Le paramètre ?v= change à chaque nouvelle photo : le navigateur recharge l'image
    vehicle.photoUrl = `/vehicle-photos/${id}?v=${Date.now()}`;
    await this.repo.save(vehicle);

    // On relit le véhicule pour ne pas renvoyer le contenu de la photo dans la réponse
    return this.findOne(id);
  }

  async removePhoto(id: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.photoData = null;
    vehicle.photoMime = null;
    vehicle.photoUrl = null;
    await this.repo.save(vehicle);
    return this.findOne(id);
  }

  // Contenu de la photo, pour l'afficher sur le site
  async getPhoto(id: string): Promise<{ data: Buffer; mime: string }> {
    const vehicle = await this.repo
      .createQueryBuilder('v')
      .addSelect(['v.photoData', 'v.photoMime'])
      .where('v.id = :id', { id })
      .getOne();
    if (!vehicle?.photoData || !vehicle.photoMime) {
      throw new NotFoundException('Photo introuvable');
    }
    return { data: vehicle.photoData, mime: vehicle.photoMime };
  }
}