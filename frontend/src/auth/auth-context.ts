import { createContext } from 'react';

export type Role = 'student' | 'instructor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export interface AuthContextValue {
  user: AuthUser | null;
  // true pendant la restauration de la session au chargement de la page
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);