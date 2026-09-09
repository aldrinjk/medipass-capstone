import { authService } from '../../services/authService';
import { clearAuthSession, getAccessToken, getPatientId } from '../../services/secureStore';

describe('authService Integration', () => {
  beforeEach(async () => {
    await clearAuthSession();
  });

  afterEach(async () => {
    await clearAuthSession();
  });

  it('authenticates patient and stores tokens securely in SecureStore', async () => {
    const response = await authService.login({
      email: 'patient.synth@example.com',
      password: 'StrongPassword123!',
    });

    expect(response.accessToken).toBeTruthy();
    expect(response.refreshToken).toBeTruthy();
    expect(response.patientId).toBeTruthy();

    const storedToken = await getAccessToken();
    const storedPatientId = await getPatientId();

    expect(storedToken).toBe(response.accessToken);
    expect(storedPatientId).toBe(response.patientId);
  });

  it('registers a new patient and persists credentials', async () => {
    const response = await authService.register({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice.smith@example.com',
      password: 'SecurePass987!',
    });

    expect(response.accessToken).toBeTruthy();
    expect(response.refreshToken).toBeTruthy();

    const session = await authService.restoreSession();
    expect(session).not.toBeNull();
    expect(session?.email).toBe('alice.smith@example.com');
  });

  it('restores existing patient session when tokens exist', async () => {
    await authService.login({
      email: 'restore.test@example.com',
      password: 'password123',
    });

    const session = await authService.restoreSession();
    expect(session).not.toBeNull();
    expect(session?.email).toBe('restore.test@example.com');
  });

  it('clears session on logout', async () => {
    await authService.login({
      email: 'logout.test@example.com',
      password: 'password123',
    });

    await authService.logout();

    const session = await authService.restoreSession();
    expect(session).toBeNull();
  });
});
