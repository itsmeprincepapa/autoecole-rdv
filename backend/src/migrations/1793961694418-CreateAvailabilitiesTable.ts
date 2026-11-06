import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAvailabilitiesTable1793961694418 implements MigrationInterface {
    name = 'CreateAvailabilitiesTable1793961694418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "availabilities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "instructorId" uuid NOT NULL, "dayOfWeek" smallint NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9562bd8681d40361b1a124ea52c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa8c8f61df497a6df7fc9bbd5f" ON "availabilities"  ("instructorId") `);
        await queryRunner.query(`ALTER TABLE "availabilities" ADD CONSTRAINT "FK_fa8c8f61df497a6df7fc9bbd5f7" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "availabilities" DROP CONSTRAINT "FK_fa8c8f61df497a6df7fc9bbd5f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa8c8f61df497a6df7fc9bbd5f"`);
        await queryRunner.query(`DROP TABLE "availabilities"`);
    }

}
