import { IsUUID, Matches } from 'class-validator';

export class SlotsQueryDto {
  @IsUUID()
  instructorId: string;

  // Date au format AAAA-MM-JJ
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date doit être au format AAAA-MM-JJ' })
  date: string;
}