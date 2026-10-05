import type { ReactNode } from 'react'

interface StatusScreenProps {
  icon: ReactNode
  title: string
  message: string
  tone: 'info' | 'warning' | 'error'
  onRetry?: () => void
}

/**
 * A single, unambiguous "no data" screen used whenever the public endpoint
 * does not return an emergency summary. The API contract may distinguish
 * invalid (404), expired (410), and revoked (410) states so responders get
 * useful next steps, but these screens never expose clinical data, internal
 * identifiers, token hashes, or authentication details.
 */
export function StatusScreen({ icon, title, message, tone, onRetry }: StatusScreenProps) {
  return (
    <main className={`screen screen--${tone}`} role="alert">
      <div className="screen-icon" aria-hidden="true">
        {icon}
      </div>
      <h1 className="screen-title">{title}</h1>
      <p className="screen-subtitle">{message}</p>
      {onRetry ? (
        <button type="button" className="retry-button" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </main>
  )
}
