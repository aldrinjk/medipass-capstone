import { useCallback, useEffect, useState } from 'react';
import * as passApi from '../api/passApi';
import { getCachedPublicUrl, setCachedPublicUrl } from '../api/passUrlCache';
import { ApiError } from '../../../services/apiClient';
import type { PassMetadata } from '../../../types/pass';

interface PassDetailState {
  status: 'loading' | 'loaded' | 'error';
  pass: PassMetadata | null;
  /** Only populated when this device generated/rotated the QR itself (see passUrlCache.ts). */
  publicUrl: string | null;
  error: string | null;
}

interface UsePassDetailResult extends PassDetailState {
  refresh: () => void;
  revoke: () => Promise<void>;
  rotate: () => Promise<void>;
  actionInFlight: 'revoke' | 'rotate' | null;
  actionError: string | null;
}

export function usePassDetail(passId: string): UsePassDetailResult {
  const [state, setState] = useState<PassDetailState>({
    status: 'loading',
    pass: null,
    publicUrl: null,
    error: null,
  });
  const [reloadToken, setReloadToken] = useState(0);
  const [actionInFlight, setActionInFlight] = useState<'revoke' | 'rotate' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));

    Promise.all([passApi.getPass(passId), getCachedPublicUrl(passId)])
      .then(([pass, publicUrl]) => {
        if (cancelled) return;
        setState({ status: 'loaded', pass, publicUrl, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          status: 'error',
          pass: null,
          publicUrl: null,
          error: err instanceof ApiError ? err.message : 'Could not load this pass.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [passId, reloadToken]);

  const revoke = useCallback(async () => {
    setActionInFlight('revoke');
    setActionError(null);
    try {
      const updated = await passApi.revokePass(passId);
      setState((prev) => ({ ...prev, pass: updated }));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not revoke this pass.');
    } finally {
      setActionInFlight(null);
    }
  }, [passId]);

  const rotate = useCallback(async () => {
    setActionInFlight('rotate');
    setActionError(null);
    try {
      const rotated = await passApi.rotatePass(passId);
      await setCachedPublicUrl(passId, rotated.publicUrl);
      // The rotated QR must replace the displayed one immediately (spec 6.3).
      setState((prev) => ({
        ...prev,
        publicUrl: rotated.publicUrl,
        pass: prev.pass
          ? { ...prev.pass, status: rotated.status, expiresAt: rotated.expiresAt, categories: rotated.categories }
          : prev.pass,
      }));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not rotate this pass.');
    } finally {
      setActionInFlight(null);
    }
  }, [passId]);

  return { ...state, refresh, revoke, rotate, actionInFlight, actionError };
}
