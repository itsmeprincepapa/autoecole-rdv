import { IsISO8601, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  instructorId: string;

  // Début du créneau, tel que renvoyé par GET /slots (ISO 8601, UTC)
  @IsISO8601()
  startsAt: string;
}