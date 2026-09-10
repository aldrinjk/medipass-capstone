import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePassDetail } from '../hooks/usePassDetail';
import * as passApi from '../api/passApi';
import { getCachedPublicUrl, setCachedPublicUrl } from '../api/passUrlCache';
import { __resetSecureStoreMock } from '../../../__mocks__/expo-secure-store';

jest.mock('../api/passApi');

const basePass = {
  passId: 'pass-1',
  status: 'ACTIVE' as const,
  expiresAt: '2030-01-01T00:00:00.000Z',
  categories: ['ALLERGIES' as const],
  createdAt: '2026-01-01T00:00:00.000Z',
  revokedAt: null,
};

describe('usePassDetail', () => {
  beforeEach(() => {
    __resetSecureStoreMock();
    jest.clearAllMocks();
  });

  it('loads pass metadata and any cached publicUrl for this device', async () => {
    (passApi.getPass as jest.Mock).mockResolvedValue(basePass);
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/cached-token');

    const { result } = await renderHook(() => usePassDetail('pass-1'));

    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.pass).toEqual(basePass);
    expect(result.current.publicUrl).toBe('https://responder.example/passes/cached-token');
  });

  it('has a null publicUrl when nothing was cached for this pass', async () => {
    (passApi.getPass as jest.Mock).mockResolvedValue(basePass);

    const { result } = await renderHook(() => usePassDetail('pass-1'));

    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.publicUrl).toBeNull();
  });

  it('rotate() immediately replaces the displayed publicUrl and re-caches it', async () => {
    (passApi.getPass as jest.Mock).mockResolvedValue(basePass);
    (passApi.rotatePass as jest.Mock).mockResolvedValue({
      passId: 'pass-1',
      status: 'ACTIVE',
      expiresAt: '2030-02-01T00:00:00.000Z',
      publicUrl: 'https://responder.example/passes/rotated-token',
      categories: ['ALLERGIES'],
    });
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/old-token');

    const { result } = await renderHook(() => usePassDetail('pass-1'));
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    await act(async () => {
      await result.current.rotate();
    });

    expect(result.current.publicUrl).toBe('https://responder.example/passes/rotated-token');
    expect(result.current.pass?.expiresAt).toBe('2030-02-01T00:00:00.000Z');
    expect(await getCachedPublicUrl('pass-1')).toBe('https://responder.example/passes/rotated-token');
  });

  it('revoke() updates the pass status from the response', async () => {
    (passApi.getPass as jest.Mock).mockResolvedValue(basePass);
    (passApi.revokePass as jest.Mock).mockResolvedValue({ ...basePass, status: 'REVOKED' });

    const { result } = await renderHook(() => usePassDetail('pass-1'));
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    await act(async () => {
      await result.current.revoke();
    });

    expect(result.current.pass?.status).toBe('REVOKED');
  });

  it('surfaces an action error without clobbering the loaded pass', async () => {
    (passApi.getPass as jest.Mock).mockResolvedValue(basePass);
    (passApi.revokePass as jest.Mock).mockRejectedValue(new Error('conflict'));

    const { result } = await renderHook(() => usePassDetail('pass-1'));
    await waitFor(() => expect(result.current.status).toBe('loaded'));

    await act(async () => {
      await result.current.revoke();
    });

    expect(result.current.actionError).toBe('Could not revoke this pass.');
    expect(result.current.pass?.status).toBe('ACTIVE');
  });
});
