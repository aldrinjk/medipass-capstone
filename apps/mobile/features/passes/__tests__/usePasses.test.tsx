import { renderHook, waitFor } from '@testing-library/react-native';
import { usePasses } from '../hooks/usePasses';
import * as passApi from '../api/passApi';

jest.mock('../api/passApi');

describe('usePasses', () => {
  it('loads and exposes the list of passes', async () => {
    (passApi.listPasses as jest.Mock).mockResolvedValue([
      {
        passId: 'pass-1',
        status: 'ACTIVE',
        expiresAt: '2030-01-01T00:00:00.000Z',
        categories: ['ALLERGIES'],
        createdAt: '2026-01-01T00:00:00.000Z',
        revokedAt: null,
      },
    ]);

    const { result } = await renderHook(() => usePasses());

    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.passes).toHaveLength(1);
    expect(result.current.passes[0].passId).toBe('pass-1');
  });

  it('surfaces an error state when the list request fails', async () => {
    (passApi.listPasses as jest.Mock).mockRejectedValue(new Error('network down'));

    const { result } = await renderHook(() => usePasses());

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Could not load your passes.');
  });
});
