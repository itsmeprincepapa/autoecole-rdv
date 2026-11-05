import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  // UUID plutôt qu'un entier : impossible de deviner l'id d'un autre utilisateur
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Email unique : deux comptes ne peuvent pas avoir le même
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  // Mot de passe haché (jamais en clair).
  // select: false => exclu des requêtes par défaut, donc jamais renvoyé par l'API
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  // Le rôle est imposé par le serveur, jamais fourni par le client
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  // false tant que l'élève n'a pas saisi son code de vérification
  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  // Permet au gérant de désactiver un compte sans le supprimer
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

    // --- Vérification de l'email ---
  // Code à 6 chiffres haché (SHA-256), jamais stocké en clair
  @Column({ type: 'varchar', length: 64, nullable: true, select: false })
  verificationCodeHash: string | null;

  // Le code expire 10 minutes après son envoi
  @Column({ type: 'timestamptz', nullable: true })
  verificationExpiresAt: Date | null;

  // Nombre de tentatives ratées (le code est invalidé après 5)
  @Column({ type: 'int', default: 0 })
  verificationAttempts: number;

  // Date du dernier envoi, pour limiter les renvois (1 par minute)
  @Column({ type: 'timestamptz', nullable: true })
  verificationSentAt: Date | null;

  // timestamptz = date avec fuseau horaire (stockée en UTC)
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}