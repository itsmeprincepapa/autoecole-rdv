import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateVehiclesTable1793960813297 implements MigrationInterface {
    name = 'CreateVehiclesTable1793960813297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "plateNumber" character varying(20) NOT NULL, "model" character varying(100) NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, "unavailableReason" character varying(255), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_66ea96381a7a7ceb35c72f36625" UNIQUE ("plateNumber"), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "vehicles"`);
    }

}
