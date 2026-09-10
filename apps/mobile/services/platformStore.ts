import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store only works on iOS/Android -- it wraps the OS keychain
 * / keystore, which doesn't exist in a browser. On web it falls back to
 * localStorage, which is NOT secure storage; this exists purely so
 * `expo start --web` / `npm run web` is usable for local development and
 * demos. Every real deployment target for this app is iOS/Android via
 * Expo Go or a dev build, where the OS-backed SecureStore path is used.
 */

export async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures (e.g. private browsing) on the web dev preview.
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
