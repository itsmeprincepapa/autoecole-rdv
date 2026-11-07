import { useContext } from 'react';
import { AuthContext } from './auth-context';

// Usage dans un composant : const { user, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}