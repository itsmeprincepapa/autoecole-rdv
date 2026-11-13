import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreConstraintsAndPhotoInDb1794500000000 implements MigrationInterface {
  name = 'RestoreConstraintsAndPhotoInDb1794500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. On remet les protections supprimées par erreur
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`);

    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "no_overlap_instructor"`,
    );
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "no_overlap_instructor"
      EXCLUDE USING gist (
        "instructorId" WITH =,
        tstzrange("startsAt", "endsAt") WITH &&
      ) WHERE ("status" <> 'cancelled')
    `);

    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "no_overlap_vehicle"`,
    );
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD CONSTRAINT "no_overlap_vehicle"
      EXCLUDE USING gist (
        "vehicleId" WITH =,
        tstzrange("startsAt", "endsAt") WITH &&
      ) WHERE ("status" <> 'cancelled')
    `);

    await queryRunner.query(
      `ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "check_end_after_start"`,
    );
    await queryRunner.query(
      `ALTER TABLE "appointments" ADD CONSTRAINT "check_end_after_start" CHECK ("endsAt" > "startsAt")`,
    );

    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP CONSTRAINT IF EXISTS "check_evaluation_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD CONSTRAINT "check_evaluation_level" CHECK ("level" BETWEEN 1 AND 4)`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "check_hours_balance_positive"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "check_hours_balance_positive" CHECK ("hoursBalance" >= 0)`,
    );

    // 2. Les photos sont stockées dans la base (le disque de Render gratuit est effacé)
    await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "photoData" bytea`);
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "photoMime" character varying(20)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "photoMime"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "photoData"`);
  }
}