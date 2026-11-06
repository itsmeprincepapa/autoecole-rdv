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

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Le moniteur concerné. Si on supprime le moniteur, ses plages disparaissent.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'instructorId' })
  instructor: User;

  @Index()
  @Column({ type: 'uuid' })
  instructorId: string;

  // 0 = dimanche, 1 = lundi ... 6 = samedi
  @Column({ type: 'smallint' })
  dayOfWeek: number;

  // Heures locales de l'auto-école au format "HH:MM" (type time en base)
  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}