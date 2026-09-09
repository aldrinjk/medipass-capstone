import {
  saveAuthSession,
  getAccessToken,
  getRefreshToken,
  getPatientId,
  clearAuthSession,
} from '../../services/secureStore';

describe('secureStore Service', () => {
  beforeEach(async () => {
    await clearAuthSession();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('saves and retrieves access token, refresh token, and patient ID', async () => {
    await saveAuthSession('test-access-token', 'test-refresh-token', 'pat-12345', 'test@example.com');

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    const patientId = await getPatientId();

    expect(accessToken).toBe('test-access-token');
    expect(refreshToken).toBe('test-refresh-token');
    expect(patientId).toBe('pat-12345');
  });

  it('clears all session keys on logout', async () => {
    await saveAuthSession('token-a', 'token-b', 'pat-999');
    await clearAuthSession();

    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    const patientId = await getPatientId();

    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
    expect(patientId).toBeNull();
  });
});
