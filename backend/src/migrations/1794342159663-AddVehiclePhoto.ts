import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehiclePhoto1794342159663 implements MigrationInterface {
    name = 'AddVehiclePhoto1794342159663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "check_hours_balance_positive"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "check_end_after_start"`);
        await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "check_evaluation_level"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "no_overlap_instructor"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "no_overlap_vehicle"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "photoUrl" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "photoUrl"`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "no_overlap_vehicle" EXCLUDE USING gist ("vehicleId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ((status <> 'cancelled'::appointments_status_enum))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "no_overlap_instructor" EXCLUDE USING gist ("instructorId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ((status <> 'cancelled'::appointments_status_enum))`);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD CONSTRAINT "check_evaluation_level" CHECK (((level >= 1) AND (level <= 4)))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "check_end_after_start" CHECK (("endsAt" > "startsAt"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "check_hours_balance_positive" CHECK (("hoursBalance" >= 0))`);
    }

}
