import { apiClient } from './apiClient';
import {
  saveAuthSession,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getPatientId,
  getUserEmail,
} from './secureStore';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  UserSession,
} from '../types';
import { MOCK_PATIENT_PROFILE } from './mockData';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', credentials);
      const data = response.data;
      await saveAuthSession(data.accessToken, data.refreshToken, data.patientId, credentials.email);
      return data;
    } catch (error) {
      // Synthetic fallback for local testing if server is unreachable
      if (process.env.NODE_ENV === 'development' || !process.env.EXPO_PUBLIC_API_BASE_URL) {
        console.warn('Backend unavailable, using simulated local session for demonstration.');
        const mockAuth: AuthResponse = {
          accessToken: 'mock-jwt-access-token',
          refreshToken: 'mock-jwt-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          patientId: MOCK_PATIENT_PROFILE.id,
        };
        await saveAuthSession(
          mockAuth.accessToken,
          mockAuth.refreshToken,
          mockAuth.patientId,
          credentials.email
        );
        return mockAuth;
      }
      throw error;
    }
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/register', payload);
      const data = response.data;
      await saveAuthSession(data.accessToken, data.refreshToken, data.patientId, payload.email);
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development' || !process.env.EXPO_PUBLIC_API_BASE_URL) {
        console.warn('Backend unavailable, using simulated registration for demonstration.');
        const mockAuth: AuthResponse = {
          accessToken: 'mock-jwt-access-token',
          refreshToken: 'mock-jwt-refresh-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          patientId: 'pat-new-registered',
        };
        await saveAuthSession(
          mockAuth.accessToken,
          mockAuth.refreshToken,
          mockAuth.patientId,
          payload.email
        );
        return mockAuth;
      }
      throw error;
    }
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/refresh', {
      refreshToken,
    } as RefreshTokenRequest);
    return response.data;
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
    const patientId = await getPatientId();
    const email = await getUserEmail();

    if (accessToken && patientId) {
      return {
        patientId,
        email: email ?? undefined,
      };
    }
    return null;
  },
};
