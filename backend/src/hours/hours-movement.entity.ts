import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { HoursMovementType } from './hours-movement-type.enum';

@Entity('hours_movements')
export class HoursMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // L'élève concerné
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  // Qui a fait le mouvement (le gérant, ou l'élève lui-même pour une réservation)
  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ type: 'enum', enum: HoursMovementType })
  type: HoursMovementType;

  // Positif = ajout, négatif = retrait
  @Column({ type: 'int' })
  amount: number;

  // Solde juste après ce mouvement (pratique pour l'historique)
  @Column({ type: 'int' })
  balanceAfter: number;

  // Motif libre (ex : "Forfait 20 h payé en agence")
  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  // Rendez-vous lié (réservation ou remboursement), sinon null
  @Column({ type: 'uuid', nullable: true })
  appointmentId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}