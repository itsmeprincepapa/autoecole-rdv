import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AppointmentStatus } from '../appointments/appointment-status.enum';
import { Appointment } from '../appointments/appointment.entity';
import { UserRole } from '../users/user-role.enum';
import { EvaluateDto } from './dto/evaluate.dto';
import { Evaluation } from './evaluation.entity';
import { Skill } from './skill.entity';

interface Actor {
  id: string;
  role: UserRole;
}

@Injectable()
export class ProgressService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Skill) private readonly skills: Repository<Skill>,
    @InjectRepository(Evaluation)
    private readonly evaluations: Repository<Evaluation>,
  ) {}

  listSkills() {
    return this.skills.find({ order: { position: 'ASC' } });
  }

  // Le moniteur de la leçon (ou le gérant) évalue des compétences
  async evaluate(actor: Actor, appointmentId: string, dto: EvaluateDto) {
    const appointment = await this.dataSource
      .getRepository(Appointment)
      .findOne({ where: { id: appointmentId } });

    const notFound = new NotFoundException('Rendez-vous introuvable');
    if (!appointment) throw notFound;
    if (
      actor.role === UserRole.INSTRUCTOR &&
      appointment.instructorId !== actor.id
    ) {
      throw notFound;
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Seule une leçon effectuée peut être évaluée',
      );
    }

    // Pas de compétence en double dans la même requête
    const skillIds = dto.evaluations.map((e) => e.skillId);
    if (new Set(skillIds).size !== skillIds.length) {
      throw new BadRequestException('Compétence en double');
    }
    const found = await this.skills.count({ where: { id: In(skillIds) } });
    if (found !== skillIds.length) {
      throw new BadRequestException('Compétence inconnue');
    }

    // Réévaluer la même compétence sur la même leçon remplace la note
    await this.evaluations.upsert(
      dto.evaluations.map((e) => ({
        appointmentId,
        studentId: appointment.studentId,
        skillId: e.skillId,
        level: e.level,
      })),
      ['appointmentId', 'skillId'],
    );

    return { message: 'Évaluation enregistrée' };
  }

  // Carnet d'un élève : niveau actuel de chaque compétence + dernières notes
  async getLogbook(studentId: string) {
    const skills = await this.listSkills();
    const all = await this.evaluations.find({
      where: { studentId },
      relations: { appointment: true },
      order: { createdAt: 'DESC' },
    });

    const completed = await this.dataSource
      .getRepository(Appointment)
      .find({
        where: { studentId, status: AppointmentStatus.COMPLETED },
        order: { startsAt: 'DESC' },
        take: 10,
      });

    return {
      skills: skills.map((s) => {
        // La première trouvée est la plus récente (tri décroissant)
        const last = all.find((e) => e.skillId === s.id);
        return { id: s.id, name: s.name, level: last ? last.level : 0 };
      }),
      lessons: completed.map((a) => ({
        id: a.id,
        startsAt: a.startsAt,
        notes: a.notes,
      })),
    };
  }
}