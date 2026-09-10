import Constants from 'expo-constants';

/**
 * Base URL of the Spring Boot API. Configure with the EXPO_PUBLIC_API_BASE_URL
 * env var (see .env.example) -- this is a *public* var by Expo convention, so
 * it must never carry secrets, only the API's public base URL.
 *
 * This app talks to Spring Boot only. It never holds a Supabase URL/key or
 * database credentials (docs/team-handoffs sections 3 and 8).
 */
const fallback = 'http://localhost:8080';

export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  fallback
).replace(/\/$/, '');
