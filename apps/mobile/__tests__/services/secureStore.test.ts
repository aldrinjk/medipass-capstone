import {
  saveAuthSession,
  getAccessToken,
  getRefreshToken,
  getUserEmail,
  clearAuthSession,
} from '../../services/secureStore';

describe('secureStore Service', () => {
  beforeEach(async () => {
    await clearAuthSession();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('saves and retrieves access token, refresh token, and email', async () => {
    await saveAuthSession('test-access-token', 'test-refresh-token', 'test@example.com');

    expect(await getAccessToken()).toBe('test-access-token');
    expect(await getRefreshToken()).toBe('test-refresh-token');
    expect(await getUserEmail()).toBe('test@example.com');
  });

  it('clears all session keys on logout', async () => {
    await saveAuthSession('token-a', 'token-b', 'test@example.com');
    await clearAuthSession();

    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
    expect(await getUserEmail()).toBeNull();
  });
});
