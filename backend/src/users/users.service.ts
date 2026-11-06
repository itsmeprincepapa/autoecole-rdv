import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    // Le repository est l'objet TypeORM qui lit et écrit dans la table users
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Retrouve un utilisateur par son email (sans le mot de passe haché)
  // Retourne null si personne n'a cet email
  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Retrouve un utilisateur par son id
  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // Retrouve un utilisateur par email AVEC son mot de passe haché.
  // À utiliser uniquement pour la connexion (vérification du mot de passe).
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  // Crée et enregistre un nouvel utilisateur
  async create(data: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

    // Met à jour certains champs d'un utilisateur
  async update(id: string, data: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, data);
  }

    // Retrouve un utilisateur avec son code de vérification haché
  // (à utiliser uniquement pour vérifier le code)
  findByEmailWithVerification(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.verificationCodeHash')
      .where('user.email = :email', { email })
      .getOne();
  }

    // Retrouve un utilisateur avec l'empreinte de son refresh token
  findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :id', { id })
      .getOne();
  }

    // Liste paginée, sans aucun champ sensible (select: false les exclut déjà)
  async list(role: UserRole | undefined, page: number, limit: number) {
    const [items, total] = await this.usersRepository.findAndCount({
      where: role ? { role } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        hoursBalance: true,
        createdAt: true,
      },
    });
    return { items, total, page, limit };
  }

  // Active ou désactive un compte. Désactiver coupe aussi la session.
  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.usersRepository.update(
      id,
      isActive ? { isActive } : { isActive, refreshTokenHash: null },
    );
  }
}