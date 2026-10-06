import { FormEvent, useState } from 'react'
import {
  confirmResponderVerification,
  startResponderEmergencyOverride,
  startResponderVerification,
} from '../api/publicPassClient'
import type { ResponderVerificationStartResponse } from '../api/types'

interface ResponderVerificationGateProps {
  token: string
  onVerified: (verificationToken: string) => void
}

export function ResponderVerificationGate({
  token,
  onVerified,
}: ResponderVerificationGateProps) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [organization, setOrganization] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [challenge, setChallenge] = useState<ResponderVerificationStartResponse | null>(null)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const start = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await startResponderVerification(token, {
        name,
        role,
        organization,
        phone,
      })
      if (result.kind === 'success') {
        setChallenge(result.data)
      } else {
        setError(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const confirm = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge) return

    setError(null)
    setBusy(true)
    try {
      const result = await confirmResponderVerification(token, {
        challengeId: challenge.challengeId,
        code,
      })
      if (result.kind === 'success') {
        onVerified(result.data.verificationToken)
      } else {
        setError(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  const override = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const result = await startResponderEmergencyOverride(token, {
        name,
        role,
        organization,
        reason: overrideReason,
      })
      if (result.kind === 'success') {
        onVerified(result.data.verificationToken)
      } else {
        setError(result.message)
      }
    } finally {
      setBusy(false)
    }
  }

  if (challenge) {
    return (
      <main className="verification-page">
        <section className="verification-card" aria-labelledby="otp-title">
          <p className="verification-eyebrow">MediPass responder verification</p>
          <h1 id="otp-title">Enter verification code</h1>
          <p className="verification-copy">
            We sent a one-time code to {challenge.maskedPhone}. Successful verification proves
            control of that phone number; the responder name remains self-declared.
          </p>

          {challenge.deliveryMode === 'DEVELOPMENT' && challenge.developmentCode ? (
            <div className="verification-dev-code" role="note">
              Development mode only — no SMS was sent. Test code: <strong>{challenge.developmentCode}</strong>
            </div>
          ) : null}

          <form onSubmit={confirm} className="verification-form">
            <label>
              One-time code
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6-digit code"
                required
              />
            </label>

            {error ? <p className="verification-error">{error}</p> : null}

            <button type="submit" className="verification-primary" disabled={busy}>
              {busy ? 'Verifying…' : 'Verify and view emergency summary'}
            </button>
            <button
              type="button"
              className="verification-secondary"
              onClick={() => {
                setChallenge(null)
                setCode('')
                setError(null)
              }}
              disabled={busy}
            >
              Use a different number
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="verification-page">
      <section className="verification-card" aria-labelledby="verification-title">
        <p className="verification-eyebrow">MediPass emergency access</p>
        <h1 id="verification-title">Verify responder access</h1>
        <p className="verification-copy">
          Before viewing patient-authorized emergency information, identify yourself and verify
          control of your mobile number. Your access will be recorded in the patient&apos;s audit trail.
        </p>

        <form onSubmit={start} className="verification-form">
          <label>
            Full name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={120}
              required
            />
          </label>

          <label>
            Role
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Paramedic, nurse, physician…"
              maxLength={80}
            />
          </label>

          <label>
            Organization
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              placeholder="Hospital, EMS service…"
              maxLength={120}
            />
          </label>

          <label>
            Mobile number
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+919876543210"
              autoComplete="tel"
              required
            />
            <small>Use international format with country code.</small>
          </label>

          {error ? <p className="verification-error">{error}</p> : null}

          <button type="submit" className="verification-primary" disabled={busy}>
            {busy ? 'Sending code…' : 'Send verification code'}
          </button>
        </form>

        <div className="verification-divider"><span>Emergency fallback</span></div>

        {!overrideOpen ? (
          <button
            type="button"
            className="verification-secondary"
            onClick={() => setOverrideOpen(true)}
          >
            Emergency access without phone verification
          </button>
        ) : (
          <form onSubmit={override} className="verification-form verification-override">
            <p className="verification-warning">
              This access will be clearly marked as an unverified emergency override. Your supplied
              name, role, organization, device, time, and trace code will still be logged.
            </p>
            <label>
              Emergency reason
              <textarea
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                placeholder="Example: no cellular service during emergency response"
                maxLength={200}
                required
              />
            </label>
            <button
              type="submit"
              className="verification-danger"
              disabled={busy || name.trim().length === 0}
            >
              {busy ? 'Opening emergency access…' : 'Continue with unverified emergency access'}
            </button>
          </form>
        )}

        <p className="verification-privacy">
          MediPass stores only the last four digits of a phone number after successful verification.
          A phone OTP verifies control of that number, not the responder&apos;s legal name.
        </p>
      </section>
    </main>
  )
}
