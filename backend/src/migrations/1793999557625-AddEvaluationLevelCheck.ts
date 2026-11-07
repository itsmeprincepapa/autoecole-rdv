import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluationLevelCheck1793999557625 implements MigrationInterface {
  name = 'AddEvaluationLevelCheck1793999557625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluations" ADD CONSTRAINT "check_evaluation_level" CHECK ("level" BETWEEN 1 AND 4)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "evaluations" DROP CONSTRAINT "check_evaluation_level"`,
    );
  }
}