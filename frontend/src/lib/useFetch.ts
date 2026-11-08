import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';

// Charge une donnée du backend : { data, loading, error, reload }
// path = null : rien n'est chargé (par exemple tant qu'un choix n'est pas fait)
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(path !== null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path === null) {
      setData(null);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    api<T>(path)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof ApiError ? err.message : 'Une erreur est survenue');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, loading, error, reload };
}