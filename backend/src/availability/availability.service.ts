import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/user-role.enum';
import { UsersService } from '../users/users.service';
import { Availability } from './availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

// "HH:MM" ou "HH:MM:SS" -> minutes depuis minuit
const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

interface Actor {
  id: string;
  role: UserRole;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly repo: Repository<Availability>,
    private readonly usersService: UsersService,
  ) {}

  // Un moniteur agit sur lui-même ; un admin peut agir sur n'importe quel moniteur
  private assertCanManage(actor: Actor, instructorId: string) {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.INSTRUCTOR && actor.id === instructorId) return;
    throw new ForbiddenException('Accès refusé');
  }

  private async assertIsInstructor(instructorId: string) {
    const user = await this.usersService.findById(instructorId);
    if (!user || user.role !== UserRole.INSTRUCTOR) {
      throw new NotFoundException('Moniteur introuvable');
    }
  }

  async list(actor: Actor, instructorId: string): Promise<Availability[]> {
    this.assertCanManage(actor, instructorId);
    await this.assertIsInstructor(instructorId);
    return this.repo.find({
      where: { instructorId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async create(
    actor: Actor,
    instructorId: string,
    dto: CreateAvailabilityDto,
  ): Promise<Availability> {
    this.assertCanManage(actor, instructorId);
    await this.assertIsInstructor(instructorId);

    const start = toMinutes(dto.startTime);
    const end = toMinutes(dto.endTime);
    if (end <= start) {
      throw new BadRequestException("L'heure de fin doit être après l'heure de début");
    }

    // Refuse le chevauchement avec une plage existante du même jour
    const sameDay = await this.repo.find({
      where: { instructorId, dayOfWeek: dto.dayOfWeek },
    });
    const overlaps = sameDay.some(
      (a) => start < toMinutes(a.endTime) && end > toMinutes(a.startTime),
    );
    if (overlaps) {
      throw new ConflictException('Cette plage chevauche une plage existante');
    }

    return this.repo.save(
      this.repo.create({
        instructorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
      }),
    );
  }

  async remove(actor: Actor, instructorId: string, id: string) {
    this.assertCanManage(actor, instructorId);
    // On filtre aussi par instructorId : impossible de supprimer la plage d'un autre
    const slot = await this.repo.findOne({ where: { id, instructorId } });
    if (!slot) throw new NotFoundException('Plage introuvable');
    await this.repo.remove(slot);
    return { message: 'Plage supprimée' };
  }
}