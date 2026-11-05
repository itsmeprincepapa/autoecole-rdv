import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

// Hachage SHA-256 du code : suffisant pour un code court et de durée limitée
const hashCode = (code: string) =>
  createHash('sha256').update(code).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Le rôle est imposé par le serveur, jamais par le client
    const user = await this.usersService.create({
      email,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      passwordHash,
      role: UserRole.STUDENT,
    });

    await this.sendVerificationCode(user);

    return {
      message: 'Compte créé. Un code de vérification a été envoyé par email.',
      email: user.email,
    };
  }

  // Génère un code, le stocke haché, puis l'envoie par email
  private async sendVerificationCode(user: User): Promise<void> {
    // randomInt est cryptographiquement sûr (contrairement à Math.random)
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.usersService.update(user.id, {
      verificationCodeHash: hashCode(code),
      verificationExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      verificationAttempts: 0,
      verificationSentAt: new Date(),
    });

    await this.mailService.sendVerificationCode(user.email, code);
  }
}