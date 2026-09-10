import * as SecureStore from 'expo-secure-store';

/**
 * Thin wrapper around expo-secure-store for auth tokens.
 *
 * Security notes (docs/team-handoffs section 6.8 / 7):
 * - Auth tokens live only in the OS-backed secure keystore, never in
 *   AsyncStorage, plain state persisted to disk, or EXPO_PUBLIC_* config.
 * - Values are never logged.
 */

const ACCESS_TOKEN_KEY = 'medipass.accessToken';
const REFRESH_TOKEN_KEY = 'medipass.refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
