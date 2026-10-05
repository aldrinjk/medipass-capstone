import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicPass } from './publicPassClient'
import type { PublicPassSummary } from './types'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('fetchPublicPass', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns success with the parsed summary for an active pass (200)', async () => {
    const summary: PublicPassSummary = {
      passId: '11111111-1111-1111-1111-111111111111',
      expiresAt: '2030-01-01T00:00:00Z',
      categories: ['ALLERGIES'],
      demographics: null,
      allergies: [{ id: 'a1', substance: 'Penicillin', reaction: 'Anaphylaxis', severity: 'Severe' }],
      medications: null,
      conditions: null,
      emergencyContact: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, summary)))

    const result = await fetchPublicPass('good-token')

    expect(result).toEqual({ kind: 'success', data: summary })
  })

  it('requests the exact public endpoint path with no auth header and no credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        passId: '1',
        expiresAt: '2030-01-01T00:00:00Z',
        categories: [],
        demographics: null,
        allergies: null,
        medications: null,
        conditions: null,
        emergencyContact: null,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchPublicPass('abc123')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://localhost:8080/api/v1/public/passes/abc123')
    expect(init.credentials).toBe('omit')
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('returns not-found for an invalid token (404)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(404, {
          timestamp: '2030-01-01T00:00:00Z',
          status: 404,
          code: 'PUBLIC_PASS_NOT_FOUND',
          message: 'Pass not found.',
          path: '/api/v1/public/passes/bad-token',
        }),
      ),
    )

    const result = await fetchPublicPass('bad-token')

    expect(result).toEqual({ kind: 'not-found' })
  })

  it('returns gone/expired for a 410 with the expired error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(410, {
          timestamp: '2030-01-01T00:00:00Z',
          status: 410,
          code: 'PUBLIC_PASS_EXPIRED',
          message: 'Pass expired.',
          path: '/api/v1/public/passes/old-token',
        }),
      ),
    )

    const result = await fetchPublicPass('old-token')

    expect(result).toEqual({ kind: 'gone', reason: 'expired' })
  })

  it('returns gone/revoked for a 410 with the revoked error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(410, {
          timestamp: '2030-01-01T00:00:00Z',
          status: 410,
          code: 'PUBLIC_PASS_REVOKED',
          message: 'Pass revoked.',
          path: '/api/v1/public/passes/revoked-token',
        }),
      ),
    )

    const result = await fetchPublicPass('revoked-token')

    expect(result).toEqual({ kind: 'gone', reason: 'revoked' })
  })

  it('returns network-error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const result = await fetchPublicPass('any-token')

    expect(result).toEqual({ kind: 'network-error' })
  })

  it('returns not-found for a blank token without calling fetch', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPublicPass('   ')

    expect(result).toEqual({ kind: 'not-found' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns a generic error for an unexpected status code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })))

    const result = await fetchPublicPass('any-token')

    expect(result.kind).toBe('error')
  })
})
