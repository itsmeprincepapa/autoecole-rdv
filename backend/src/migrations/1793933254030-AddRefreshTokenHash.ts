import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokenHash1793933254030 implements MigrationInterface {
    name = 'AddRefreshTokenHash1793933254030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshTokenHash" character varying(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshTokenHash"`);
    }

}
