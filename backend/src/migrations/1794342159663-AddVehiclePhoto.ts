import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehiclePhoto1794342159663 implements MigrationInterface {
  name = 'AddVehiclePhoto1794342159663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "photoUrl" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "photoUrl"`);
  }
}