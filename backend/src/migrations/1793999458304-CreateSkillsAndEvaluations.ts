import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSkillsAndEvaluations1793999458304 implements MigrationInterface {
    name = 'CreateSkillsAndEvaluations1793999458304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "skills" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "position" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_81f05095507fd84aa2769b4a522" UNIQUE ("name"), CONSTRAINT "PK_0d3212120f4ecedf90864d7e298" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "evaluations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "appointmentId" uuid NOT NULL, "studentId" uuid NOT NULL, "skillId" uuid NOT NULL, "level" smallint NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_7d086423e3cb905cea7c95995e9" UNIQUE ("appointmentId", "skillId"), CONSTRAINT "PK_f683b433eba0e6dae7e19b29e29" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_3c4c76fe2864368c00f90b7a03" ON "evaluations"  ("studentId") `);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD CONSTRAINT "FK_82aa51dff61e51351db2a2a1751" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD CONSTRAINT "FK_3c4c76fe2864368c00f90b7a03e" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "evaluations" ADD CONSTRAINT "FK_de8036581e0efed0f51175aa8b9" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_de8036581e0efed0f51175aa8b9"`);
        await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_3c4c76fe2864368c00f90b7a03e"`);
        await queryRunner.query(`ALTER TABLE "evaluations" DROP CONSTRAINT "FK_82aa51dff61e51351db2a2a1751"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3c4c76fe2864368c00f90b7a03"`);
        await queryRunner.query(`DROP TABLE "evaluations"`);
        await queryRunner.query(`DROP TABLE "skills"`);
    }

}
