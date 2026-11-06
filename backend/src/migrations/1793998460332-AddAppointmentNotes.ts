import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAppointmentNotes1793998460332 implements MigrationInterface {
    name = 'AddAppointmentNotes1793998460332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "check_hours_balance_positive"`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "notes" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "check_hours_balance_positive" CHECK (("hoursBalance" >= 0))`);
    }

}
