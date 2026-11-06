import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Ex : "Créneaux", "Ronds-points"
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  // Pour afficher les compétences dans un ordre logique
  @Column({ type: 'int', default: 0 })
  position: number;
}