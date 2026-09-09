import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'medipass_access_token';
const REFRESH_TOKEN_KEY = 'medipass_refresh_token';
const PATIENT_ID_KEY = 'medipass_patient_id';
const USER_EMAIL_KEY = 'medipass_user_email';

// Memory fallback for web or environments where SecureStore isn't native
const memoryStorage = new Map<string, string>();

async function isSecureStoreAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  } else {
    memoryStorage.set(key, value);
  }
}

export async function getItem(key: string): Promise<string | null> {
  const available = await isSecureStoreAvailable();
  if (available) {
    return await SecureStore.getItemAsync(key);
  }
  return memoryStorage.get(key) ?? null;
}

export async function deleteItem(key: string): Promise<void> {
  const available = await isSecureStoreAvailable();
  if (available) {
    await SecureStore.deleteItemAsync(key);
  } else {
    memoryStorage.delete(key);
  }
}

export async function saveAuthSession(
  accessToken: string,
  refreshToken: string,
  patientId: string,
  email?: string
): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);
  await setItem(PATIENT_ID_KEY, patientId);
  if (email) {
    await setItem(USER_EMAIL_KEY, email);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return await getItem(ACCESS_TOKEN_KEY);
}

export async function setAccessToken(token: string): Promise<void> {
  await setItem(ACCESS_TOKEN_KEY, token);
}

export async function getRefreshToken(): Promise<string | null> {
  return await getItem(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await setItem(REFRESH_TOKEN_KEY, token);
}

export async function getPatientId(): Promise<string | null> {
  return await getItem(PATIENT_ID_KEY);
}

export async function getUserEmail(): Promise<string | null> {
  return await getItem(USER_EMAIL_KEY);
}

export async function clearAuthSession(): Promise<void> {
  await deleteItem(ACCESS_TOKEN_KEY);
  await deleteItem(REFRESH_TOKEN_KEY);
  await deleteItem(PATIENT_ID_KEY);
  await deleteItem(USER_EMAIL_KEY);
  memoryStorage.clear();
}
