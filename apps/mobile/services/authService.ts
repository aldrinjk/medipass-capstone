import { apiClient, isMockEnabled } from './apiClient';
import {
  saveAuthSession,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getUserEmail,
} from './secureStore';
import { persistRotatedTokens } from './apiClient';
import {
  AuthTokensResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UserSession,
} from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<UserSession> {
    if (isMockEnabled()) {
      const mockTokens: AuthTokensResponse = {
        accessToken: 'mock-jwt-access-token',
        refreshToken: 'mock-jwt-refresh-token',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      };
      await saveAuthSession(mockTokens.accessToken, mockTokens.refreshToken, credentials.email);
      return {
        id: 'pat-mock-uuid',
        email: credentials.email,
        role: 'PATIENT',
      };
    }

    const response = await apiClient.post<AuthTokensResponse>('/api/v1/auth/login', credentials);
    const data = response.data;
    await saveAuthSession(data.accessToken, data.refreshToken, credentials.email);

    const meResponse = await apiClient.get<RegisterResponse>('/api/v1/auth/me');
    return {
      id: meResponse.data.id,
      email: meResponse.data.email,
      role: meResponse.data.role,
    };
  },

  async register(payload: RegisterRequest): Promise<UserSession> {
    if (isMockEnabled()) {
      return this.login(payload);
    }

    // Step 1: POST /auth/register
    await apiClient.post<RegisterResponse>('/api/v1/auth/register', {
      email: payload.email,
      password: payload.password,
    });

    // Step 2-5: login -> save tokens -> GET /auth/me -> return user
    return this.login({
      email: payload.email,
      password: payload.password,
    });
  },

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const response = await apiClient.post<AuthTokensResponse>('/api/v1/auth/refresh', {
      refreshToken,
    });
    const tokens = response.data;
    await persistRotatedTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/api/v1/auth/logout', { refreshToken });
      }
    } catch {
      // proceed with local cleanup regardless
    } finally {
      await clearAuthSession();
    }
  },

  async restoreSession(): Promise<UserSession | null> {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return null;
    }

    if (isMockEnabled()) {
      const email = await getUserEmail();
      return {
        id: 'pat-mock-uuid',
        email: email || 'patient@example.com',
        role: 'PATIENT',
      };
    }

    try {
      const meResponse = await apiClient.get<RegisterResponse>('/api/v1/auth/me');
      return {
        id: meResponse.data.id,
        email: meResponse.data.email,
        role: meResponse.data.role,
      };
    } catch {
      await clearAuthSession();
      return null;
    }
  },
};
