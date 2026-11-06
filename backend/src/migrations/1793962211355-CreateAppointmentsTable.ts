import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAppointmentsTable1793962211355 implements MigrationInterface {
    name = 'CreateAppointmentsTable1793962211355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."appointments_status_enum" AS ENUM('confirmed', 'cancelled', 'completed', 'no_show')`);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentId" uuid NOT NULL, "instructorId" uuid NOT NULL, "vehicleId" uuid NOT NULL, "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "endsAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."appointments_status_enum" NOT NULL DEFAULT 'confirmed', "cancelledAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2b9cc59cbf6f67ea2c18b41190" ON "appointments"  ("studentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_aeab670aa667547b8deaddf38d" ON "appointments"  ("instructorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_550d0e0c440b5a8a1701aa8efe" ON "appointments"  ("vehicleId") `);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_2b9cc59cbf6f67ea2c18b411907" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_aeab670aa667547b8deaddf38d6" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_550d0e0c440b5a8a1701aa8efe7" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_550d0e0c440b5a8a1701aa8efe7"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_aeab670aa667547b8deaddf38d6"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_2b9cc59cbf6f67ea2c18b411907"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_550d0e0c440b5a8a1701aa8efe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aeab670aa667547b8deaddf38d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b9cc59cbf6f67ea2c18b41190"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP TYPE "public"."appointments_status_enum"`);
    }

}
