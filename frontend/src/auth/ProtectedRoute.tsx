import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { homePath } from '../lib/roles';
import type { Role } from './auth-context';
import { useAuth } from './useAuth';

// Réserve une page aux utilisateurs connectés ayant l'un des rôles autorisés
export default function ProtectedRoute({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-8 text-slate-600">Chargement...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  // Connecté mais pas le bon rôle : retour à son propre espace
  if (!roles.includes(user.role)) {
    return <Navigate to={homePath(user.role)} replace />;
  }
  return <>{children}</>;
}