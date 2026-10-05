import { useParams } from 'react-router-dom'
import { EmergencySummary } from '../components/EmergencySummary'
import { LoadingScreen } from '../components/LoadingScreen'
import { StatusScreen } from '../components/StatusScreen'
import { usePublicPass } from '../hooks/usePublicPass'

export function EmergencySummaryPage() {
  const { token } = useParams<{ token: string }>()
  const state = usePublicPass(token)

  if (state.status === 'loading') {
    return <LoadingScreen />
  }

  switch (state.kind) {
    case 'success':
      return <EmergencySummary summary={state.data} />

    case 'not-found':
      return (
        <StatusScreen
          tone="warning"
          icon={<QrOffIcon />}
          title="Link not recognized"
          message="This QR code doesn't match an active MediPass emergency pass. Ask the patient to show you their current code."
        />
      )

    case 'gone':
      return (
        <StatusScreen
          tone="warning"
          icon={<ClockIcon />}
          title={state.reason === 'revoked' ? 'Access no longer available' : 'This pass has expired'}
          message={
            state.reason === 'revoked'
              ? 'The patient has turned off access to this emergency pass.'
              : 'This emergency pass is no longer active. Ask the patient for a current QR code if possible.'
          }
        />
      )

    case 'network-error':
      return (
        <StatusScreen
          tone="error"
          icon={<WifiOffIcon />}
          title="Can't reach MediPass"
          message="Check your internet connection and try again."
          onRetry={() => window.location.reload()}
        />
      )

    case 'error':
    default:
      return (
        <StatusScreen
          tone="error"
          icon={<WifiOffIcon />}
          title="Something went wrong"
          message="We couldn't load this emergency summary. Please try again."
          onRetry={() => window.location.reload()}
        />
      )
  }
}

function QrOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="14" y1="14" x2="21" y2="21" />
      <line x1="21" y1="14" x2="14" y2="21" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  )
}

function WifiOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 13a10 10 0 0 1 3.6-2.5" />
      <path d="M15.4 10.5A10 10 0 0 1 19 13" />
      <path d="M2 8.5a15 15 0 0 1 4.2-2.8" />
      <path d="M17.8 5.7A15 15 0 0 1 22 8.5" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  )
}
