import { authService } from '../../services/authService';
import { apiClient, isMockEnabled } from '../../services/apiClient';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveAuthSession,
} from '../../services/secureStore';

jest.mock('../../services/apiClient', () => {
  const actual = jest.requireActual('../../services/apiClient');
  return {
    ...actual,
    isMockEnabled: jest.fn(() => false),
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };
});

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedIsMockEnabled = isMockEnabled as jest.MockedFunction<typeof isMockEnabled>;

const tokens = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  tokenType: 'Bearer',
  expiresInSeconds: 3600,
};

const me = {
  id: 'user-uuid-1',
  email: 'patient.synth@example.com',
  role: 'PATIENT',
};

describe('authService contracts', () => {
  beforeEach(async () => {
    await clearAuthSession();
    mockedIsMockEnabled.mockReturnValue(false);
    mockedClient.get.mockReset();
    mockedClient.post.mockReset();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('logs in, stores tokens, and loads the user from GET /auth/me', async () => {
    mockedClient.post.mockResolvedValueOnce({ data: tokens } as never);
    mockedClient.get.mockResolvedValueOnce({ data: me } as never);

    const session = await authService.login({
      email: 'patient.synth@example.com',
      password: 'StrongPassword123!',
    });

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'patient.synth@example.com',
      password: 'StrongPassword123!',
    });
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(session).toEqual(me);
    expect(session).not.toHaveProperty('patientId');
    expect(await getAccessToken()).toBe(tokens.accessToken);
    expect(await getRefreshToken()).toBe(tokens.refreshToken);
  });

  it('registers with email and password then logs in', async () => {
    mockedClient.post
      .mockResolvedValueOnce({
        data: { id: 'user-uuid-1', email: 'alice.smith@example.com', role: 'PATIENT' },
      } as never)
      .mockResolvedValueOnce({ data: tokens } as never);
    mockedClient.get.mockResolvedValueOnce({
      data: { id: 'user-uuid-1', email: 'alice.smith@example.com', role: 'PATIENT' },
    } as never);

    const session = await authService.register({
      email: 'alice.smith@example.com',
      password: 'SecurePass987!',
    });

    expect(mockedClient.post.mock.calls[0][0]).toBe('/api/v1/auth/register');
    expect(mockedClient.post.mock.calls[0][1]).toEqual({
      email: 'alice.smith@example.com',
      password: 'SecurePass987!',
    });
    expect(mockedClient.post.mock.calls[1][0]).toBe('/api/v1/auth/login');
    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(session).toEqual({
      id: 'user-uuid-1',
      email: 'alice.smith@example.com',
      role: 'PATIENT',
    });
  });

  it('restores a session with GET /auth/me and stored tokens', async () => {
    await saveAuthSession('stored-access', 'stored-refresh', 'restore.test@example.com');
    mockedClient.get.mockResolvedValueOnce({
      data: { id: 'user-uuid-2', email: 'restore.test@example.com', role: 'PATIENT' },
    } as never);

    const session = await authService.restoreSession();

    expect(mockedClient.get).toHaveBeenCalledWith('/api/v1/auth/me');
    expect(session).toEqual({
      id: 'user-uuid-2',
      email: 'restore.test@example.com',
      role: 'PATIENT',
    });
  });

  it('clears the session when /auth/me fails during restore', async () => {
    await saveAuthSession('stored-access', 'stored-refresh', 'restore.test@example.com');
    mockedClient.get.mockRejectedValueOnce(new Error('unauthorized'));

    const session = await authService.restoreSession();

    expect(session).toBeNull();
    expect(await getAccessToken()).toBeNull();
  });

  it('persists a rotated refresh token from /auth/refresh', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        accessToken: 'access-2',
        refreshToken: 'refresh-2',
        tokenType: 'Bearer',
        expiresInSeconds: 3600,
      },
    } as never);

    const rotated = await authService.refresh('refresh-1');

    expect(mockedClient.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {
      refreshToken: 'refresh-1',
    });
    expect(rotated.refreshToken).toBe('refresh-2');
    expect(await getAccessToken()).toBe('access-2');
    expect(await getRefreshToken()).toBe('refresh-2');
  });

  it('does not invent a fake session when mocks are disabled', async () => {
    mockedClient.post.mockRejectedValueOnce(new Error('API unavailable'));

    await expect(
      authService.login({ email: 'patient@example.com', password: 'password123' })
    ).rejects.toThrow('API unavailable');
    expect(await getAccessToken()).toBeNull();
  });
});
