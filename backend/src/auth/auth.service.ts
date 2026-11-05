import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/user-role.enum';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(dto: RegisterDto) {
    // On met l'email en minuscules pour éviter les doublons (Test@x.com et test@x.com)
    const email = dto.email.toLowerCase().trim();

    // Refuse si un compte existe déjà avec cet email
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hachage du mot de passe (12 = coût du calcul)
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Le rôle est imposé ici par le serveur, jamais par le client
    const user = await this.usersService.create({
      email,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      passwordHash,
      role: UserRole.STUDENT,
    });

    // On renvoie uniquement ce qui est utile, jamais le mot de passe haché
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}