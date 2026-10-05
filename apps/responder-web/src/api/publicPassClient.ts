import { API_BASE_URL } from './config'
import type { ApiErrorBody, PublicPassSummary } from './types'

export type PublicPassResult =
  | { kind: 'success'; data: PublicPassSummary }
  /** Token does not correspond to any pass (HTTP 404). */
  | { kind: 'not-found' }
  /** Pass exists but is expired or revoked (HTTP 410). */
  | { kind: 'gone'; reason: 'expired' | 'revoked' | 'unknown' }
  /** Reachable but returned something unexpected. */
  | { kind: 'error'; message: string }
  /** Fetch itself failed (offline, DNS, CORS, timeout). */
  | { kind: 'network-error' }

/**
 * Fetches the filtered public emergency summary for a scanned pass token.
 *
 * Security notes (see docs/team-handoffs section 6.8):
 * - The token is never written to console/analytics, in dev or prod.
 * - The response is rendered as-is; unshared categories are simply absent
 *   from the payload and this client never tries to infer or backfill them.
 */
export async function fetchPublicPass(token: string): Promise<PublicPassResult> {
  const trimmedToken = token.trim()
  if (trimmedToken.length === 0) {
    return { kind: 'not-found' }
  }

  let response: Response
  try {
    response = await fetch(
      `${API_BASE_URL}/api/v1/public/passes/${encodeURIComponent(trimmedToken)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        // The public endpoint is intentionally unauthenticated -- never
        // attach an Authorization header or credentials here.
        credentials: 'omit',
      },
    )
  } catch {
    return { kind: 'network-error' }
  }

  if (response.status === 200) {
    try {
      const data = (await response.json()) as PublicPassSummary
      return { kind: 'success', data }
    } catch {
      return { kind: 'error', message: 'The server returned an unreadable response.' }
    }
  }

  if (response.status === 404) {
    return { kind: 'not-found' }
  }

  if (response.status === 410) {
    const reason = await goneReason(response)
    return { kind: 'gone', reason }
  }

  return {
    kind: 'error',
    message: `Unexpected response from the server (HTTP ${response.status}).`,
  }
}

async function goneReason(response: Response): Promise<'expired' | 'revoked' | 'unknown'> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.code === 'PUBLIC_PASS_REVOKED') return 'revoked'
    if (body.code === 'PUBLIC_PASS_EXPIRED') return 'expired'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}
