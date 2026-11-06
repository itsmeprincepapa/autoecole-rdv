import { Matches } from 'class-validator';

export class ScheduleQueryDto {
  // Dates locales de l'auto-école, au format AAAA-MM-JJ
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from doit être au format AAAA-MM-JJ' })
  from: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to doit être au format AAAA-MM-JJ' })
  to: string;
}