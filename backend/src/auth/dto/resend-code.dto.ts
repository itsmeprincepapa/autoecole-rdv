import { IsEmail } from 'class-validator';

export class ResendCodeDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;
}