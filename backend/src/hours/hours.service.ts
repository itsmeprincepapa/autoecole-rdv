import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';
import { AdjustHoursDto } from './dto/adjust-hours.dto';
import { HoursMovement } from './hours-movement.entity';
import { HoursMovementType } from './hours-movement-type.enum';

@Injectable()
export class HoursService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HoursMovement)
    private readonly movements: Repository<HoursMovement>,
  ) {}

  // Applique un mouvement DANS une transaction fournie par l'appelant.
  // La ligne de l'élève est verrouillée : deux opérations simultanées
  // ne peuvent pas lire le même ancien solde.
  async applyMovement(
    manager: EntityManager,
    params: {
      studentId: string;
      createdById: string;
      type: HoursMovementType;
      amount: number;
      reason?: string | null;
      appointmentId?: string | null;
    },
  ): Promise<number> {
    const student = await manager.findOne(User, {
      where: { id: params.studentId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!student || student.role !== UserRole.STUDENT) {
      throw new NotFoundException('Élève introuvable');
    }

    const newBalance = student.hoursBalance + params.amount;
    if (newBalance < 0) {
      throw new BadRequestException('Solde d\'heures insuffisant');
    }

    await manager.update(User, student.id, { hoursBalance: newBalance });
    await manager.save(
      manager.create(HoursMovement, {
        studentId: student.id,
        createdById: params.createdById,
        type: params.type,
        amount: params.amount,
        balanceAfter: newBalance,
        reason: params.reason ?? null,
        appointmentId: params.appointmentId ?? null,
      }),
    );
    return newBalance;
  }

  // Le gérant ajoute ou retire des heures à un élève
  async adjust(adminId: string, studentId: string, dto: AdjustHoursDto) {
    if (dto.amount === 0) {
      throw new BadRequestException('Le montant ne peut pas être 0');
    }
    const balance = await this.dataSource.transaction((manager) =>
      this.applyMovement(manager, {
        studentId,
        createdById: adminId,
        type:
          dto.amount > 0
            ? HoursMovementType.CREDIT
            : HoursMovementType.ADJUSTMENT,
        amount: dto.amount,
        reason: dto.reason ?? null,
      }),
    );
    return { studentId, hoursBalance: balance };
  }

  history(studentId: string): Promise<HoursMovement[]> {
    return this.movements.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }
}