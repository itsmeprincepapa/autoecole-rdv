import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHoursBalanceAndMovements1793971149248 implements MigrationInterface {
    name = 'AddHoursBalanceAndMovements1793971149248'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."hours_movements_type_enum" AS ENUM('credit', 'adjustment', 'booking', 'refund')`);
        await queryRunner.query(`CREATE TABLE "hours_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid NOT NULL, "createdById" uuid NOT NULL, "type" "public"."hours_movements_type_enum" NOT NULL, "amount" integer NOT NULL, "balanceAfter" integer NOT NULL, "reason" character varying(255), "appointmentId" uuid, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_73f880ec3725fa17d0cf1f3e19d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f695db3d97bf7b6ce1b232d969" ON "hours_movements"  ("studentId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "hoursBalance" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "hours_movements" ADD CONSTRAINT "FK_f695db3d97bf7b6ce1b232d9696" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "hours_movements" DROP CONSTRAINT "FK_f695db3d97bf7b6ce1b232d9696"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hoursBalance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f695db3d97bf7b6ce1b232d969"`);
        await queryRunner.query(`DROP TABLE "hours_movements"`);
        await queryRunner.query(`DROP TYPE "public"."hours_movements_type_enum"`);
    }

}
