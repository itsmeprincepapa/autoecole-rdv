import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentsTable1793962549314 implements MigrationInterface {
    name = 'CreateAppointmentsTable1793962549314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "check_end_after_start"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "no_overlap_instructor"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "no_overlap_vehicle"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "no_overlap_vehicle" EXCLUDE USING gist ("vehicleId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ((status <> 'cancelled'::appointments_status_enum))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "no_overlap_instructor" EXCLUDE USING gist ("instructorId" WITH =, tstzrange("startsAt", "endsAt") WITH &&) WHERE ((status <> 'cancelled'::appointments_status_enum))`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "check_end_after_start" CHECK (("endsAt" > "startsAt"))`);
    }

}
