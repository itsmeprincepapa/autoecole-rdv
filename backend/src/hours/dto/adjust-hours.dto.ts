import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class AdjustHoursDto {
  // Positif pour ajouter, négatif pour retirer (de -100 à +100)
  @IsInt()
  @Min(-100)
  @Max(100)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}