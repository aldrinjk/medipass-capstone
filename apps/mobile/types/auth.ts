/**
 * Minimal auth types for the temporary dev sign-in gate in app/(auth).
 * Mirrors apps/api/src/main/java/com/medipass/auth/*.java.
 *
 * NOTE: full authentication screens (register/login/forgot-password UX,
 * profile, dashboard) are Team Member 1's ownership per README.md "Team
 * ownership". This file + app/(auth) exist only so this module has
 * something to call POST /api/v1/passes with locally -- keep it thin, and
 * expect Team Member 1's real auth experience to replace app/(auth)
 * wholesale without needing changes inside features/passes.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}
