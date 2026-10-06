import { useEffect, useState } from 'react'
import { fetchPublicPass, type PublicPassResult } from '../api/publicPassClient'

export type PublicPassState =
  | { status: 'loading' }
  | ({ status: 'loaded' } & PublicPassResult)

/**
 * Loads the public pass once per scanned token / short-lived verification
 * session. Neither token is persisted in browser storage.
 */
export function usePublicPass(
  token: string | undefined,
  verificationToken?: string,
): PublicPassState {
  const [state, setState] = useState<PublicPassState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    if (!token) {
      setState({ status: 'loaded', kind: 'not-found' })
      return
    }

    setState({ status: 'loading' })

    fetchPublicPass(token, verificationToken).then((result) => {
      if (!cancelled) {
        setState({ status: 'loaded', ...result })
      }
    })

    return () => {
      cancelled = true
    }
  }, [token, verificationToken])

  return state
}
