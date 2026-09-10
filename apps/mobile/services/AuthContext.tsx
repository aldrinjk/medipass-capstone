import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler } from './apiClient';
import * as authService from './authService';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './secureStore';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    getAccessToken().then((token) => {
      if (!cancelled) setStatus(token ? 'signedIn' : 'signedOut');
    });

    setUnauthorizedHandler(() => {
      setStatus('signedOut');
    });

    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      signIn: async (email, password) => {
        const tokens = await authService.login({ email, password });
        await saveTokens(tokens.accessToken, tokens.refreshToken);
        setStatus('signedIn');
      },
      signUp: async (email, password) => {
        const tokens = await authService.register({ email, password });
        await saveTokens(tokens.accessToken, tokens.refreshToken);
        setStatus('signedIn');
      },
      signOut: async () => {
        const refreshToken = await getRefreshToken();
        await clearTokens();
        setStatus('signedOut');
        if (refreshToken) {
          // Best-effort -- don't block sign-out on the network call.
          authService.logout(refreshToken).catch(() => {});
        }
      },
    }),
    [status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
