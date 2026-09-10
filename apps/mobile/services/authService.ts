import { apiRequest } from './apiClient';
import type { AuthTokens, LoginRequest, RegisterRequest } from '../types/auth';

/**
 * Thin client for POST /api/v1/auth/{register,login,logout}. See the note
 * in types/auth.ts -- this exists only to unblock local development of the
 * passes/QR module and is expected to be superseded by Team Member 1's
 * real authentication experience.
 */

export function login(request: LoginRequest): Promise<AuthTokens> {
  return apiRequest<AuthTokens>('/api/v1/auth/login', {
    method: 'POST',
    body: request,
    auth: false,
  });
}

export async function register(request: RegisterRequest): Promise<AuthTokens> {
  await apiRequest<unknown>('/api/v1/auth/register', {
    method: 'POST',
    body: request,
    auth: false,
  });
  // Registration alone doesn't return tokens (see RegisterResponse.java) --
  // log the new account straight in so the rest of the app only ever
  // needs to reason about "signed in or not".
  return login(request);
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/api/v1/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  });
}
