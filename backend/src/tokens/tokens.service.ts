import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { OneTimeToken } from './one-time-token.entity';
import { TokenType } from './token-type.enum';

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class TokensService {
  constructor(
    @InjectRepository(OneTimeToken)
    private readonly repo: Repository<OneTimeToken>,
  ) {}

  // Crée un token et renvoie sa valeur EN CLAIR (à mettre dans le lien email).
  // En base, seul le hash est enregistré.
  async create(
    userId: string,
    type: TokenType,
    lifetimeMinutes: number,
  ): Promise<string> {
    // Une nouvelle demande invalide les précédentes du même type
    await this.repo.update(
      { userId, type, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    const token = randomBytes(32).toString('hex');
    await this.repo.save(
      this.repo.create({
        userId,
        type,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + lifetimeMinutes * 60 * 1000),
        usedAt: null,
      }),
    );
    return token;
  }

  // Vérifie un token et le marque comme utilisé.
  // Retourne l'id de l'utilisateur, ou null si invalide, expiré, déjà utilisé
  // ou d'un autre type.
  async consume(token: string, type: TokenType): Promise<string | null> {
    const record = await this.repo.findOne({
      where: { tokenHash: hashToken(token), type },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) return null;

    await this.repo.update(record.id, { usedAt: new Date() });
    return record.userId;
  }
}