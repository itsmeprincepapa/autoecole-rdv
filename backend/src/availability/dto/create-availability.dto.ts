import { IsInt, Matches, Max, Min } from 'class-validator';

export class CreateAvailabilityDto {
  // 0 = dimanche ... 6 = samedi
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  // Format HH:MM (00:00 à 23:59)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime doit être au format HH:MM' })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime doit être au format HH:MM' })
  endTime: string;
}