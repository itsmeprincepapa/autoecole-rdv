import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Plaque unique : deux véhicules ne peuvent pas avoir la même
  @Column({ type: 'varchar', length: 20, unique: true })
  plateNumber: string;

  // Ex : "Renault Clio"
  @Column({ type: 'varchar', length: 100 })
  model: string;

  // false = bloqué (panne, entretien) : n'est plus proposé à la réservation
  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  // Raison du blocage (null si disponible)
  @Column({ type: 'varchar', length: 255, nullable: true })
  unavailableReason: string | null;

    // Chemin public de la photo (ex : /uploads/vehicles/xxxx.jpg), null s'il n'y en a pas
  @Column({ type: 'varchar', length: 255, nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}