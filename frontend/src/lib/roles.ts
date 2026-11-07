import type { Role } from '../auth/auth-context';

// Page d'accueil de chaque rôle après la connexion
export function homePath(role: Role): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'instructor':
      return '/instructor';
    default:
      return '/student';
  }
}