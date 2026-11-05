import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationFields1793876936194 implements MigrationInterface {
    name = 'AddEmailVerificationFields1793876936194'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCodeHash" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationExpiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationAttempts" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationSentAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationSentAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationAttempts"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCodeHash"`);
    }

}
