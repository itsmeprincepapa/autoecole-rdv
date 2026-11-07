import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api, SESSION_EXPIRED_EVENT, tokenStore } from '../lib/api';
import { AuthContext } from './auth-context';
import type { AuthUser } from './auth-context';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Au chargement : si des tokens existent, on récupère le profil
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!tokenStore.getAccess() && !tokenStore.getRefresh()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api<AuthUser>('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  // Session non renouvelable : retour à l'état déconnecté
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    tokenStore.set(res.accessToken, res.refreshToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Invalide le refresh token côté serveur
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // Même si le serveur est injoignable, on déconnecte localement
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}