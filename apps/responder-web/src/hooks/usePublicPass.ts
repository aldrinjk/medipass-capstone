import { useEffect, useState } from 'react'
import { fetchPublicPass, type PublicPassResult } from '../api/publicPassClient'

export type PublicPassState =
  | { status: 'loading' }
  | ({ status: 'loaded' } & PublicPassResult)

/**
 * Loads the public emergency summary for a token exactly once per token
 * change. The token itself is only ever used as a fetch path segment --
 * it is never stored (no localStorage/sessionStorage) and never logged.
 */
export function usePublicPass(token: string | undefined): PublicPassState {
  const [state, setState] = useState<PublicPassState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    if (!token) {
      setState({ status: 'loaded', kind: 'not-found' })
      return
    }

    setState({ status: 'loading' })

    fetchPublicPass(token).then((result) => {
      if (!cancelled) {
        setState({ status: 'loaded', ...result })
      }
    })

    return () => {
      cancelled = true
    }
  }, [token])

  return state
}
