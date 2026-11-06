import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Tous les champs sont optionnels : on modifie seulement ce qui est envoyé
export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  plateNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model?: string;

  // false = bloquer le véhicule, true = le remettre en service
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  unavailableReason?: string;
}