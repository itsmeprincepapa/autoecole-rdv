import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class EvaluationItemDto {
  @IsUUID()
  skillId: string;

  @IsInt()
  @Min(1)
  @Max(4)
  level: number;
}

export class EvaluateDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EvaluationItemDto)
  evaluations: EvaluationItemDto[];
}