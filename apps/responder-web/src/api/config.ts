/**
 * Base URL of the Spring Boot API. Configure per environment via
 * VITE_API_BASE_URL (see .env.example). Falls back to the local backend
 * port used across this repository (apps/api/src/main/resources/application.yml).
 *
 * This is the ONLY backend this app ever talks to. It never receives a
 * Supabase URL, a Supabase key, or database credentials.
 */
export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/$/, '')
