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
import { TokenType } from './token-type.enum';

@Entity('one_time_tokens')
export class OneTimeToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // L'utilisateur concerné. Si on supprime l'utilisateur, ses tokens disparaissent.
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: TokenType })
  type: TokenType;

  // Empreinte SHA-256 du token. Index unique : sert aussi à le retrouver vite.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  // Date d'utilisation. null = pas encore utilisé (usage unique).
  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}