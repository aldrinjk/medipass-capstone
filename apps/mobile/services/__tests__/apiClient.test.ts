import { apiRequest, ApiError, setUnauthorizedHandler } from '../apiClient';
import { clearTokens, getAccessToken, saveTokens } from '../secureStore';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  beforeEach(async () => {
    await clearTokens();
    setUnauthorizedHandler(null);
    jest.restoreAllMocks();
  });

  it('attaches "Authorization: Bearer <token>" when an access token is stored', async () => {
    await saveTokens('the-access-token', 'the-refresh-token');
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiRequest('/api/v1/passes');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer the-access-token');
  });

  it('does not attach an Authorization header for auth: false requests', async () => {
    await saveTokens('the-access-token', 'the-refresh-token');
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await apiRequest('/api/v1/auth/login', { method: 'POST', body: {}, auth: false });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('parses the ApiError envelope (code/message/validationErrors) on a non-2xx response', async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse(400, {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        validationErrors: { expiresAt: 'Expiry time must be in the future.' },
      }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiRequest('/api/v1/passes', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      validationErrors: { expiresAt: 'Expiry time must be in the future.' },
    });
  });

  it('refreshes the access token once on 401 and retries the original request', async () => {
    await saveTokens('expired-token', 'valid-refresh-token');

    const fetchMock = jest
      .fn()
      // 1. original request -> 401
      .mockResolvedValueOnce(jsonResponse(401, { code: 'UNAUTHORIZED' }))
      // 2. refresh call -> new tokens
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
      )
      // 3. retried original request -> success
      .mockResolvedValueOnce(jsonResponse(200, { passId: '1' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await apiRequest<{ passId: string }>('/api/v1/passes/1');

    expect(result).toEqual({ passId: '1' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(await getAccessToken()).toBe('new-access-token');
  });

  it('clears tokens and invokes the unauthorized handler when refresh also fails', async () => {
    await saveTokens('expired-token', 'bad-refresh-token');
    const unauthorizedHandler = jest.fn();
    setUnauthorizedHandler(unauthorizedHandler);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { code: 'UNAUTHORIZED' }))
      .mockResolvedValueOnce(jsonResponse(401, { code: 'INVALID_REFRESH_TOKEN' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(apiRequest('/api/v1/passes')).rejects.toBeInstanceOf(ApiError);

    expect(unauthorizedHandler).toHaveBeenCalledTimes(1);
    expect(await getAccessToken()).toBeNull();
  });

  it('wraps a thrown fetch failure as a NETWORK_ERROR ApiError', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

    await expect(apiRequest('/api/v1/passes')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
