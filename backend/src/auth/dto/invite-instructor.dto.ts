import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class InviteInstructorDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;
}