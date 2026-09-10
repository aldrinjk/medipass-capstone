import type { ReactNode } from 'react'

interface StatusScreenProps {
  icon: ReactNode
  title: string
  message: string
  tone: 'info' | 'warning' | 'error'
  onRetry?: () => void
}

/**
 * A single, unambiguous "no data" screen used for every case where the
 * public endpoint did not return an emergency summary: invalid token,
 * expired pass, revoked pass, or a request failure. It intentionally
 * never reveals anything about whether a pass ever existed for the
 * scanned token (see docs/team-handoffs section 6.6).
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
