export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  patientId: string;
}

export interface UserSession {
  patientId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: string[];
  timestamp?: string;
}
