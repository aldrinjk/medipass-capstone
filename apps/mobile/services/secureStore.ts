import * as platformStore from './platformStore';

/**
 * Thin wrapper around platformStore for auth tokens (see platformStore.ts
 * for the native-vs-web split).
 *
 * Security notes (docs/team-handoffs section 6.8 / 7):
 * - On iOS/Android, tokens live only in the OS-backed secure keystore,
 *   never in AsyncStorage, plain state persisted to disk, or
 *   EXPO_PUBLIC_* config.
 * - Values are never logged.
 */

const ACCESS_TOKEN_KEY = 'medipass.accessToken';
const REFRESH_TOKEN_KEY = 'medipass.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return platformStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return platformStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    platformStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    platformStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    platformStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    platformStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
