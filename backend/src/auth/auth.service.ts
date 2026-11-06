import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/user-role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

// Hachage SHA-256 : suffisant pour un code court ou un token déjà aléatoire
const hashCode = (code: string) =>
  createHash('sha256').update(code).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmailWithPassword(email);

    // Même message si l'email n'existe pas ou si le mot de passe est faux
    const invalid = new UnauthorizedException('Email ou mot de passe incorrect');
    if (!user) throw invalid;

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) throw invalid;

    // Ces vérifications viennent APRÈS le mot de passe
    if (!user.emailVerified) {
      throw new ForbiddenException('Email non vérifié');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Compte désactivé');
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // Échange un refresh token valide contre une nouvelle paire de tokens
  async refresh(dto: RefreshDto) {
    const invalid = new UnauthorizedException('Session invalide, reconnectez-vous');

    let payload: { sub: string };
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw invalid;
    }

    const user = await this.usersService.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) throw invalid;

    // Le token présenté doit être celui enregistré (comparaison en temps constant)
    const expected = Buffer.from(user.refreshTokenHash);
    const received = Buffer.from(hashCode(dto.refreshToken));
    const ok =
      expected.length === received.length && timingSafeEqual(expected, received);
    if (!ok) throw invalid;

    // Rotation : un nouveau refresh token remplace l'ancien
    const tokens = await this.issueTokens(user);
    return tokens;
  }

  // Déconnexion : on efface l'empreinte, le refresh token ne marche plus
  async logout(userId: string) {
    await this.usersService.update(userId, { refreshTokenHash: null });
    return { message: 'Déconnecté' };
  }

  // Fabrique access + refresh token et enregistre l'empreinte du refresh
  private async issueTokens(user: User) {
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );

    await this.usersService.update(user.id, {
      refreshTokenHash: hashCode(refreshToken),
    });

    return { accessToken, refreshToken };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmailWithVerification(email);

    const invalid = new BadRequestException('Code invalide ou expiré');

    if (!user || user.emailVerified || !user.verificationCodeHash) throw invalid;
    if (!user.verificationExpiresAt || user.verificationExpiresAt < new Date())
      throw invalid;
    if (user.verificationAttempts >= 5) throw invalid;

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

    const response = {
      message: 'Si un compte non vérifié existe, un nouveau code a été envoyé.',
    };

    if (!user || user.emailVerified) return response;

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