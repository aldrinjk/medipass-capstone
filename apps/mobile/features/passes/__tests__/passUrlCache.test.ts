import {
  clearCachedPublicUrl,
  getCachedPublicUrl,
  setCachedPublicUrl,
} from '../api/passUrlCache';
import { __resetSecureStoreMock } from '../../../__mocks__/expo-secure-store';

describe('passUrlCache', () => {
  beforeEach(() => {
    __resetSecureStoreMock();
  });

  it('returns null for a pass that was never cached', async () => {
    expect(await getCachedPublicUrl('unknown-pass')).toBeNull();
  });

  it('round-trips a stored publicUrl', async () => {
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/token-1');
    expect(await getCachedPublicUrl('pass-1')).toBe('https://responder.example/passes/token-1');
  });

  it('replaces the cached URL for the same pass on rotation', async () => {
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/old-token');
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/new-token');
    expect(await getCachedPublicUrl('pass-1')).toBe('https://responder.example/passes/new-token');
  });

  it('forgets a pass once cleared', async () => {
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/token-1');
    await clearCachedPublicUrl('pass-1');
    expect(await getCachedPublicUrl('pass-1')).toBeNull();
  });

  it('keeps entries for other passes independent', async () => {
    await setCachedPublicUrl('pass-1', 'https://responder.example/passes/token-1');
    await setCachedPublicUrl('pass-2', 'https://responder.example/passes/token-2');
    expect(await getCachedPublicUrl('pass-1')).toBe('https://responder.example/passes/token-1');
    expect(await getCachedPublicUrl('pass-2')).toBe('https://responder.example/passes/token-2');
  });
});
