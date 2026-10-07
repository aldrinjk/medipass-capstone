import { API_BASE_URL } from './config'
import type {
  ApiErrorBody,
  PublicPassSummary,
  ResponderVerificationSessionResponse,
  ResponderVerificationStartResponse,
} from './types'

export type PublicPassResult =
  | { kind: 'success'; data: PublicPassSummary }
  | { kind: 'verification-required' }
  | { kind: 'not-found' }
  | { kind: 'gone'; reason: 'expired' | 'revoked' | 'unknown' }
  | { kind: 'error'; message: string }
  | { kind: 'network-error' }

export type VerificationActionResult<T> =
  | { kind: 'success'; data: T }
  | { kind: 'error'; message: string }

const REQUEST_TIMEOUT_MS = 10_000

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export async function fetchPublicPass(
  token: string,
  verificationToken?: string,
): Promise<PublicPassResult> {
  const trimmedToken = token.trim()
  if (trimmedToken.length === 0) {
    return { kind: 'not-found' }
  }

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (verificationToken) {
    headers['X-MediPass-Verification'] = verificationToken
  }

  let response: Response
  try {
    response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/public/passes/${encodeURIComponent(trimmedToken)}`,
      {
        method: 'GET',
        headers,
        credentials: 'omit',
        cache: 'no-store',
      },
    )
  } catch {
    return { kind: 'network-error' }
  }

  if (response.status === 200) {
    try {
      return { kind: 'success', data: (await response.json()) as PublicPassSummary }
    } catch {
      return { kind: 'error', message: 'The server returned an unreadable response.' }
    }
  }

  if (response.status === 428) {
    return { kind: 'verification-required' }
  }

  if (response.status === 404) {
    return { kind: 'not-found' }
  }

  if (response.status === 410) {
    return { kind: 'gone', reason: await goneReason(response) }
  }

  return {
    kind: 'error',
    message: await apiMessage(response, `Unexpected response from the server (HTTP ${response.status}).`),
  }
}

export async function startResponderVerification(
  token: string,
  body: { name: string; role: string; organization: string; phone: string },
): Promise<VerificationActionResult<ResponderVerificationStartResponse>> {
  return postVerification(
    token,
    'verification/start',
    body,
  )
}

export async function confirmResponderVerification(
  token: string,
  body: { challengeId: string; code: string },
): Promise<VerificationActionResult<ResponderVerificationSessionResponse>> {
  return postVerification(
    token,
    'verification/confirm',
    body,
  )
}

export async function startResponderEmergencyOverride(
  token: string,
  body: { name: string; role: string; organization: string; reason: string },
): Promise<VerificationActionResult<ResponderVerificationSessionResponse>> {
  return postVerification(
    token,
    'verification/emergency-override',
    body,
  )
}

async function postVerification<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<VerificationActionResult<T>> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/api/v1/public/passes/${encodeURIComponent(token.trim())}/${path}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        cache: 'no-store',
        body: JSON.stringify(body),
      },
    )

    if (response.ok) {
      return { kind: 'success', data: (await response.json()) as T }
    }

    const fallback =
      response.status === 404
        ? 'This emergency pass was not found.'
        : response.status === 410
          ? 'This emergency pass is no longer active.'
          : 'Responder verification could not be completed.'

    return { kind: 'error', message: await apiMessage(response, fallback) }
  } catch {
    return {
      kind: 'error',
      message: 'MediPass could not be reached. Check the connection and try again.',
    }
  }
}

async function apiMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.validationErrors) {
      const first = Object.values(body.validationErrors)[0]
      if (first) return first
    }
    return body.message || fallback
  } catch {
    return fallback
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
