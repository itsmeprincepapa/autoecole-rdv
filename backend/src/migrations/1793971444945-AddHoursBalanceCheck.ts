import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHoursBalanceCheck1793971444945 implements MigrationInterface {
  name = 'AddHoursBalanceCheck1793971444945';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Même si le code a un bug, la base refuse un solde négatif
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "check_hours_balance_positive" CHECK ("hoursBalance" >= 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "check_hours_balance_positive"`,
    );
  }
}