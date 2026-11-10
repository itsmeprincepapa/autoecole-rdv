// Client HTTP vers le backend NestJS.
// Ajoute le token, renouvelle la session si besoin, normalise les erreurs.

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

// Événement émis quand la session ne peut plus être renouvelée
export const SESSION_EXPIRED_EVENT = 'session-expired';

// Adresse complète d'un fichier hébergé par le backend (ex : une photo)
export const assetUrl = (path: string) => `${API_URL}${path}`;

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Erreur renvoyée par le backend, avec son code HTTP (400, 401, 403, 409...)
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// NestJS renvoie "message" sous forme de texte ou de liste de textes
function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message: unknown }).message;
    if (Array.isArray(message)) return message.join('. ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

// Un seul renouvellement à la fois : le backend change le refresh token
// à chaque appel, deux appels simultanés feraient échouer le second.
let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        tokenStore.set(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  // Un objet est envoyé en JSON ; un FormData (envoi de fichier) est envoyé tel quel
  body?: unknown;
  // false pour les routes publiques (login, register...)
  auth?: boolean;
}

export async function api<T>(
  path: string,
  { method = 'GET', body, auth = true }: ApiOptions = {},
): Promise<T> {
  const isForm = body instanceof FormData;

  const send = () => {
    const headers: Record<string, string> = {};
    // Pour un fichier, le navigateur fixe lui-même le Content-Type
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
    const token = tokenStore.getAccess();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body:
        body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'Impossible de joindre le serveur');
  }

  // Token expiré : on tente de le renouveler, puis on rejoue la requête
  if (res.status === 401 && auth && tokenStore.getRefresh()) {
    if (await refreshTokens()) {
      res = await send();
    } else {
      tokenStore.clear();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data, 'Une erreur est survenue'));
  }
  return data as T;
}