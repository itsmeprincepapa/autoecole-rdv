import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOneTimeTokensTable1793934197196 implements MigrationInterface {
    name = 'CreateOneTimeTokensTable1793934197196'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."one_time_tokens_type_enum" AS ENUM('password_reset', 'invitation')`);
        await queryRunner.query(`CREATE TABLE "one_time_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."one_time_tokens_type_enum" NOT NULL, "tokenHash" character varying(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8e470cc9ffc1b2afa054304db17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3cd7ae667bfe489f39288fe996" ON "one_time_tokens"  ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "one_time_tokens" ADD CONSTRAINT "FK_c050f9d5e8a16e1a30a98c7257f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "one_time_tokens" DROP CONSTRAINT "FK_c050f9d5e8a16e1a30a98c7257f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3cd7ae667bfe489f39288fe996"`);
        await queryRunner.query(`DROP TABLE "one_time_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."one_time_tokens_type_enum"`);
    }

}
