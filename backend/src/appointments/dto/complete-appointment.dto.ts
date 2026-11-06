import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppointmentStatus } from '../appointment-status.enum';

export class CompleteAppointmentDto {
  // Seulement "completed" ou "no_show"
  @IsIn([AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW])
  status: AppointmentStatus.COMPLETED | AppointmentStatus.NO_SHOW;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}