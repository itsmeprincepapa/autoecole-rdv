import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './evaluation.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { Skill } from './skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, Evaluation])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}