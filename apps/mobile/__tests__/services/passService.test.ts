import { passService } from '../../services/passService';
import { sharingService } from '../../services/sharingService';
import { apiClient, isMockEnabled } from '../../services/apiClient';
import { ShareCategory } from '../../types/sharing';

jest.mock('../../services/apiClient', () => {
  const actual = jest.requireActual('../../services/apiClient');
  return {
    ...actual,
    isMockEnabled: jest.fn(() => false),
    apiClient: {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    },
  };
});

const mockedClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedIsMockEnabled = isMockEnabled as jest.MockedFunction<typeof isMockEnabled>;

describe('pass and sharing contracts', () => {
  beforeEach(() => {
    mockedIsMockEnabled.mockReturnValue(false);
    mockedClient.get.mockReset();
    mockedClient.post.mockReset();
    mockedClient.put.mockReset();
  });

  it('lists pass metadata without requiring publicUrl', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: [
        {
          passId: 'pass-1',
          status: 'ACTIVE',
          expiresAt: '2026-09-16T00:00:00Z',
          categories: ['DEMOGRAPHICS'],
          createdAt: '2026-09-15T00:00:00Z',
          revokedAt: null,
        },
      ],
    } as never);

    const passes = await passService.getPasses();
    expect(passes[0].passId).toBe('pass-1');
    expect(passes[0]).not.toHaveProperty('publicUrl');
  });

  it('returns publicUrl only from create and rotate responses', async () => {
    mockedClient.post.mockResolvedValueOnce({
      data: {
        passId: 'pass-2',
        status: 'ACTIVE',
        expiresAt: '2026-09-16T00:00:00Z',
        publicUrl: 'https://medipass.health/p/pass-2-token',
        categories: ['DEMOGRAPHICS', 'ALLERGIES'],
      },
    } as never);

    const created = await passService.createPass(['DEMOGRAPHICS', 'ALLERGIES'], 24);
    expect(created.publicUrl).toContain('pass-2');

    mockedClient.post.mockResolvedValueOnce({
      data: {
        passId: 'pass-2',
        status: 'ACTIVE',
        expiresAt: '2026-09-16T00:00:00Z',
        publicUrl: 'https://medipass.health/p/pass-2-rotated',
        categories: ['DEMOGRAPHICS', 'ALLERGIES'],
      },
    } as never);

    const rotated = await passService.rotatePass('pass-2');
    expect(rotated.publicUrl).toContain('rotated');
  });

  it('maps access logs to backend fields', async () => {
    mockedClient.get.mockResolvedValueOnce({
      data: [
        {
          id: 'log-1',
          passId: 'pass-1',
          outcome: 'SUCCESS',
          accessedAt: '2026-09-15T12:00:00Z',
        },
      ],
    } as never);

    const logs = await passService.getPatientAccessLogs();
    expect(logs[0]).toEqual({
      id: 'log-1',
      passId: 'pass-1',
      outcome: 'SUCCESS',
      accessedAt: '2026-09-15T12:00:00Z',
    });
    expect(logs[0]).not.toHaveProperty('timestamp');
    expect(logs[0]).not.toHaveProperty('accessStatus');
    expect(logs[0]).not.toHaveProperty('ipAddressTruncated');
    expect(logs[0]).not.toHaveProperty('userAgent');
  });

  it('does not fall back to mock sharing preferences when the API fails', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('network failure'));
    await expect(sharingService.getSharingPreferences()).rejects.toThrow('network failure');
  });

  it('does not fall back to mock passes when the API fails', async () => {
    mockedClient.get.mockRejectedValueOnce(new Error('network failure'));
    await expect(passService.getPasses()).rejects.toThrow('network failure');
  });

  it('updates sharing preferences without unsupported field names', async () => {
    const selected: ShareCategory[] = ['DEMOGRAPHICS', 'ALLERGIES', 'EMERGENCY_CONTACT'];
    mockedClient.put.mockResolvedValueOnce({ data: { categories: selected } } as never);

    const updated = await sharingService.updateSharingPreferences(selected);
    expect(updated.categories).toEqual(selected);
    expect(mockedClient.put).toHaveBeenCalledWith(
      '/api/v1/patients/me/sharing-preferences',
      { categories: selected }
    );
  });
});
