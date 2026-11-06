import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Appointment } from '../appointments/appointment.entity';
import { User } from '../users/user.entity';
import { Skill } from './skill.entity';

// Une seule évaluation par compétence et par leçon
@Unique(['appointmentId', 'skillId'])
@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment: Appointment;

  @Column({ type: 'uuid' })
  appointmentId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Index()
  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Skill, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skillId' })
  skill: Skill;

  @Column({ type: 'uuid' })
  skillId: string;

  // 1 à 4 (vérifié aussi par une contrainte en base)
  @Column({ type: 'smallint' })
  level: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}