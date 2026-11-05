import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Ce que le formulaire d'inscription a le droit d'envoyer.
// Aucun champ "role" : le serveur impose toujours le rôle "student".
export class RegisterDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(1, { message: 'Le prénom est obligatoire' })
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1, { message: 'Le nom est obligatoire' })
  @MaxLength(100)
  lastName: string;

  // Au moins 8 caractères, avec une lettre et un chiffre.
  // Limite haute à 72 : bcrypt ignore tout ce qui dépasse 72 caractères.
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(72, { message: 'Le mot de passe est trop long (72 caractères maximum)' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  password: string;
}