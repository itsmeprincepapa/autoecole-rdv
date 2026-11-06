import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedSkills1730000000004 implements MigrationInterface {
  name = 'SeedSkills1730000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "skills" ("name", "position") VALUES
        ('Démarrer et s''arrêter', 1),
        ('Changements de vitesse', 2),
        ('Conduite en ville', 3),
        ('Ronds-points', 4),
        ('Créneaux', 5),
        ('Marche arrière', 6),
        ('Stationnement en bataille', 7),
        ('Priorités', 8),
        ('Conduite sur route', 9)
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "skills"`);
  }
}