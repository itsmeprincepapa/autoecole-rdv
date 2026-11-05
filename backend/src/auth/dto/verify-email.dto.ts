import { IsEmail, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  // Exactement 6 chiffres
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir 6 chiffres' })
  code: string;
}