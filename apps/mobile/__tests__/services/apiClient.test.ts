import { AxiosError } from 'axios';
import { getErrorMessage, persistRotatedTokens, isMockEnabled } from '../../services/apiClient';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '../../services/secureStore';

function backendAxiosError(data: Record<string, unknown>, status = 400): AxiosError {
  return new AxiosError(
    'Request failed',
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data,
    }
  );
}

describe('apiClient helpers', () => {
  beforeEach(async () => {
    await clearAuthSession();
  });

  it('parses backend ApiError message', () => {
    const error = backendAxiosError({
      timestamp: '2026-09-15T00:00:00Z',
      status: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid credentials provided',
      path: '/api/v1/auth/login',
      validationErrors: {},
    });

    expect(getErrorMessage(error)).toBe('Invalid credentials provided');
  });

  it('joins backend validationErrors map values', () => {
    const error = backendAxiosError({
      timestamp: '2026-09-15T00:00:00Z',
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      path: '/api/v1/auth/register',
      validationErrors: {
        email: 'must be a well-formed email address',
        password: 'size must be between 8 and 72',
      },
    });

    expect(getErrorMessage(error)).toBe(
      'must be a well-formed email address, size must be between 8 and 72'
    );
  });

  it('falls back to generic error message for unknown errors', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
  });

  it('saves both rotated access and refresh tokens', async () => {
    await setAccessToken('old-access');
    await setRefreshToken('old-refresh');

    await persistRotatedTokens('new-access', 'new-refresh');

    expect(await getAccessToken()).toBe('new-access');
    expect(await getRefreshToken()).toBe('new-refresh');
  });

  it('does not enable mocks unless EXPO_PUBLIC_USE_MOCKS is exactly true', () => {
    const original = process.env.EXPO_PUBLIC_USE_MOCKS;
    delete process.env.EXPO_PUBLIC_USE_MOCKS;
    expect(isMockEnabled()).toBe(false);
    process.env.EXPO_PUBLIC_USE_MOCKS = 'false';
    expect(isMockEnabled()).toBe(false);
    process.env.EXPO_PUBLIC_USE_MOCKS = 'true';
    expect(isMockEnabled()).toBe(true);
    if (original === undefined) {
      delete process.env.EXPO_PUBLIC_USE_MOCKS;
    } else {
      process.env.EXPO_PUBLIC_USE_MOCKS = original;
    }
  });
});
