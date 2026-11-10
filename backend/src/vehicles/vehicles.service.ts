import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './vehicle.entity';

// Dossier des photos sur le disque, et début de leur adresse publique
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'vehicles');
const URL_PREFIX = '/uploads/vehicles/';

// Taille maximale d'une photo (vérifiée aussi par le contrôleur)
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

// Reconnaît le format d'après le CONTENU du fichier (ses premiers octets),
// jamais d'après son nom ni le type déclaré par le navigateur.
function detectExtension(buffer: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'webp';
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

  // Enregistre la photo d'un véhicule (remplace l'ancienne si elle existe)
  async setPhoto(id: string, buffer: Buffer): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    const extension = detectExtension(buffer);
    if (!extension) {
      throw new BadRequestException('Format non pris en charge : utilisez JPEG, PNG ou WebP');
    }

    // Le nom du fichier est choisi par le serveur : jamais celui de l'utilisateur
    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}.${extension}`;
    await writeFile(join(UPLOAD_DIR, filename), buffer);

    const previous = vehicle.photoUrl;
    vehicle.photoUrl = `${URL_PREFIX}${filename}`;
    const saved = await this.repo.save(vehicle);

    await this.deleteFile(previous);
    return saved;
  }

  async removePhoto(id: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    const previous = vehicle.photoUrl;
    vehicle.photoUrl = null;
    const saved = await this.repo.save(vehicle);

    await this.deleteFile(previous);
    return saved;
  }

  // Supprime un fichier de photo, seulement s'il porte un nom généré par le serveur
  private async deleteFile(url: string | null): Promise<void> {
    if (!url || !url.startsWith(URL_PREFIX)) return;
    const name = url.slice(URL_PREFIX.length);
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return;
    await unlink(join(UPLOAD_DIR, name)).catch(() => undefined);
  }
}