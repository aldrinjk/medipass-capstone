import { StatusScreen } from '../components/StatusScreen'

/**
 * Shown at "/" -- this site is only ever meant to be opened by scanning a
 * patient's QR code, so there is nothing to browse to here directly.
 */
export function LandingPage() {
  return (
    <StatusScreen
      tone="info"
      icon={
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      }
      title="MediPass Emergency Viewer"
      message="Scan a patient's MediPass QR code with your phone camera to view their emergency summary."
    />
  )
}
