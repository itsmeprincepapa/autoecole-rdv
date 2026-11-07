import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentExclusionConstraints1793962391932
  implements MigrationInterface
{
  name = 'AddAppointmentExclusionConstraints1793962391932';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // btree_gist permet de combiner "égalité" et "chevauchement" dans une contrainte
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    // Un moniteur ne peut pas avoir deux leçons qui se chevauchent
    // (les rendez-vous annulés sont ignorés)
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "no_overlap_instructor"
      EXCLUDE USING gist (
        "instructorId" WITH =,
        tstzrange("startsAt", "endsAt") WITH &&
      ) WHERE ("status" <> 'cancelled')
    `);

    // Idem pour un véhicule
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "no_overlap_vehicle"
      EXCLUDE USING gist (
        "vehicleId" WITH =,
        tstzrange("startsAt", "endsAt") WITH &&
      ) WHERE ("status" <> 'cancelled')
    `);

    // La fin doit être après le début
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "check_end_after_start" CHECK ("endsAt" > "startsAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "check_end_after_start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "no_overlap_vehicle"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT "no_overlap_instructor"`,
    );
  }
}