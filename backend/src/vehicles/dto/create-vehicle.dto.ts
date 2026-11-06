import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  plateNumber: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model: string;
}