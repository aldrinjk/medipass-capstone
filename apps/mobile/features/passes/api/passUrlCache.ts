import * as platformStore from '../../../services/platformStore';

/**
 * The backend only ever returns a pass's `publicUrl` at creation and
 * rotation time (apps/api/.../pass/EmergencyPassService.java stores a
 * SHA-256 hash of the token, not the raw value, so it cannot be re-issued
 * by GET /api/v1/passes/{passId}). To let the patient reopen an existing
 * pass's QR later without forcing a rotation, this app caches the last
 * known publicUrl per pass locally on-device.
 *
 * This is not sensitive data beyond what the QR itself already is (a
 * shareable link) and never leaves the device -- it is not sent
 * anywhere, unlike the auth tokens in services/secureStore.ts.
 */

const CACHE_KEY = 'medipass.passPublicUrls';
const MAX_ENTRIES = 25;

type UrlCache = Record<string, string>;

async function readCache(): Promise<UrlCache> {
  const raw = await platformStore.getItemAsync(CACHE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UrlCache;
  } catch {
    return {};
  }
}

export async function getCachedPublicUrl(passId: string): Promise<string | null> {
  const cache = await readCache();
  return cache[passId] ?? null;
}

export async function setCachedPublicUrl(passId: string, publicUrl: string): Promise<void> {
  const cache = await readCache();
  cache[passId] = publicUrl;

  const entries = Object.entries(cache);
  const trimmed =
    entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;

  await platformStore.setItemAsync(CACHE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
}

export async function clearCachedPublicUrl(passId: string): Promise<void> {
  const cache = await readCache();
  delete cache[passId];
  await platformStore.setItemAsync(CACHE_KEY, JSON.stringify(cache));
}
