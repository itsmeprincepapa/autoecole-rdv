import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

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

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmailWithVerification(email);

    // Message identique pour tous les échecs : on ne révèle rien à un pirate
    const invalid = new BadRequestException('Code invalide ou expiré');

    if (!user || user.emailVerified || !user.verificationCodeHash) throw invalid;
    if (!user.verificationExpiresAt || user.verificationExpiresAt < new Date())
      throw invalid;
    if (user.verificationAttempts >= 5) throw invalid;

    // Comparaison en temps constant
    const expected = Buffer.from(user.verificationCodeHash);
    const received = Buffer.from(hashCode(dto.code));
    const ok =
      expected.length === received.length && timingSafeEqual(expected, received);

    if (!ok) {
      await this.usersService.update(user.id, {
        verificationAttempts: user.verificationAttempts + 1,
      });
      throw invalid;
    }

    // Succès : compte vérifié, code effacé
    await this.usersService.update(user.id, {
      emailVerified: true,
      verificationCodeHash: null,
      verificationExpiresAt: null,
      verificationAttempts: 0,
    });

    return { message: 'Email vérifié. Vous pouvez vous connecter.' };
  }

  async resendCode(dto: ResendCodeDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(email);

    // Réponse identique dans tous les cas : on ne révèle pas si l'email existe
    const response = {
      message: 'Si un compte non vérifié existe, un nouveau code a été envoyé.',
    };

    if (!user || user.emailVerified) return response;

    // Délai minimum d'une minute entre deux envois
    if (
      user.verificationSentAt &&
      Date.now() - user.verificationSentAt.getTime() < 60 * 1000
    ) {
      throw new HttpException(
        'Patientez une minute avant de redemander un code',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.sendVerificationCode(user);
    return response;
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