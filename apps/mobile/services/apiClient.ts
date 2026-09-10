import { API_BASE_URL } from './apiConfig';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './secureStore';

export class ApiError extends Error {
  status: number;
  code: string;
  validationErrors?: Record<string, string>;

  constructor(status: number, code: string, message: string, validationErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.validationErrors = validationErrors;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach the current access token. Defaults to true. */
  auth?: boolean;
  /** Internal: prevents infinite refresh loops. */
  _isRetry?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

/** Registered by the auth context so a hard-expired session can redirect to sign-in. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;

      const tokens = (await response.json()) as { accessToken: string; refreshToken: string };
      await saveTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, _isRetry = false } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the MediPass server.', undefined);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 401 && auth && !_isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, _isRetry: true });
    }
    await clearTokens();
    unauthorizedHandler?.();
    throw new ApiError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    let code = 'UNKNOWN_ERROR';
    let message = `Request failed with status ${response.status}.`;
    let validationErrors: Record<string, string> | undefined;
    try {
      const errorBody = (await response.json()) as {
        code?: string;
        message?: string;
        validationErrors?: Record<string, string>;
      };
      code = errorBody.code ?? code;
      message = errorBody.message ?? message;
      validationErrors = errorBody.validationErrors;
    } catch {
      // Body wasn't JSON (or was empty) -- fall back to the defaults above.
    }
    throw new ApiError(response.status, code, message, validationErrors);
  }

  try {
    return (await response.json()) as T;
  } catch {
    return undefined as T;
  }
}
