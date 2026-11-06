import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '../users/user-role.enum';

// Contenu du token (ce qu'on a mis dans signAsync à la connexion)
interface JwtPayload {
  sub: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      // Le token est lu dans l'en-tête : Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Un token expiré est refusé
      ignoreExpiration: false,
      // Même secret que celui utilisé pour signer
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Appelée si la signature est valide.
  // Ce qu'on retourne ici devient request.user
  validate(payload: JwtPayload) {
    return { id: payload.sub, role: payload.role };
  }
}