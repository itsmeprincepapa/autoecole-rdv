import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { UserRole } from './users/user-role.enum';
import { User } from './users/user.entity';

// Script exécuté à la main : npm run seed
// Crée le premier compte gérant s'il n'existe pas encore.
async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD sont obligatoires');
  }
  if (password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD doit contenir au moins 8 caractères');
  }

  await dataSource.initialize();
  const users = dataSource.getRepository(User);

  // Idempotent : on ne recrée pas un compte déjà présent
  const existing = await users.findOne({ where: { email } });
  if (existing) {
    console.log(`Le compte ${email} existe déjà, rien à faire.`);
    await dataSource.destroy();
    return;
  }

  const admin = users.create({
    email,
    firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin',
    lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Gerant',
    passwordHash: await bcrypt.hash(password, 12),
    role: UserRole.ADMIN,
    // Le gérant est créé par le serveur : pas besoin de code par email
    emailVerified: true,
    isActive: true,
  });
  await users.save(admin);

  console.log(`Compte admin créé : ${email}`);
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Échec du seed :', error);
  process.exit(1);
});