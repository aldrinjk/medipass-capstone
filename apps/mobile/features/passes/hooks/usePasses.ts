import { useCallback, useEffect, useState } from 'react';
import * as passApi from '../api/passApi';
import { ApiError } from '../../../services/apiClient';
import type { PassMetadata } from '../../../types/pass';

interface UsePassesResult {
  passes: PassMetadata[];
  status: 'loading' | 'loaded' | 'error';
  error: string | null;
  refresh: () => void;
}

export function usePasses(): UsePassesResult {
  const [passes, setPasses] = useState<PassMetadata[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setStatus((prev) => (prev === 'loaded' ? prev : 'loading'));
    setError(null);

    passApi
      .listPasses()
      .then((result) => {
        if (cancelled) return;
        setPasses(result);
        setStatus('loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load your passes.');
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { passes, status, error, refresh };
}
