import { useEffect, useState, type SyntheticEvent } from 'react'
import type { PublicPassSummary, ResponderVerificationMethod } from '../api/types'
import { formatAge, formatExpiry } from '../utils/formatters'

interface EmergencySummaryProps {
  summary: PublicPassSummary
}

function verificationLabel(method: ResponderVerificationMethod) {
  switch (method) {
    case 'PHONE_OTP':
      return 'PHONE VERIFIED'
    case 'EMERGENCY_OVERRIDE':
      return 'UNVERIFIED EMERGENCY ACCESS'
    case 'AADHAAR_OFFLINE':
      return 'IDENTITY VERIFIED'
    case 'ORGANIZATION_SSO':
      return 'ORGANIZATION VERIFIED'
    case 'PASSKEY':
      return 'PASSKEY VERIFIED'
    default:
      return 'RESPONDER ACCESS'
  }
}

export function EmergencySummary({ summary }: EmergencySummaryProps) {
  const { demographics, allergies, medications, conditions, emergencyContact } = summary
  const age = demographics ? formatAge(demographics.birthDate) : null
  const [isObscured, setIsObscured] = useState(false)

  const verification = verificationLabel(summary.responderVerificationMethod)
  const responderIdentity = [
    summary.responderName,
    summary.responderRole,
    summary.responderOrganization,
  ].filter(Boolean).join(' · ')
  const phoneLabel = summary.responderPhoneLast4
    ? `••••${summary.responderPhoneLast4}`
    : null
  const watermarkPrimary = `MEDIPASS · ${summary.responderName} · ${verification}`
  const watermarkSecondary = [phoneLabel, summary.accessTraceCode].filter(Boolean).join(' · ')

  useEffect(() => {
    const updateVisibility = () => {
      setIsObscured(document.hidden || !document.hasFocus())
    }

    const obscure = () => setIsObscured(true)

    document.addEventListener('visibilitychange', updateVisibility)
    window.addEventListener('blur', obscure)
    window.addEventListener('focus', updateVisibility)

    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      window.removeEventListener('blur', obscure)
      window.removeEventListener('focus', updateVisibility)
    }
  }, [])

  const blockDataExtraction = (event: SyntheticEvent) => {
    event.preventDefault()
  }

  return (
    <div
      className="summary-shell"
      onCopy={blockDataExtraction}
      onCut={blockDataExtraction}
      onContextMenu={blockDataExtraction}
    >
      <div className="summary-watermark" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="summary-watermark-item" key={index}>
            <span>{watermarkPrimary}</span>
            <span>{watermarkSecondary}</span>
          </div>
        ))}
      </div>

      {isObscured ? (
        <div className="privacy-shield" role="status" aria-live="polite">
          <strong>Emergency summary hidden</strong>
          <span>Return to this page to continue viewing the patient-authorized information.</span>
        </div>
      ) : null}

      <main className="summary" aria-label="Emergency medical summary">
        <div className="privacy-banner" role="note">
          <strong>Confidential emergency information</strong>
          <span>Authorized clinical use only · Do not capture or share</span>
          <span>Responder: {responderIdentity}</span>
          <span>
            {summary.responderVerificationMethod === 'PHONE_OTP'
              ? `Phone verified ${phoneLabel ?? ''} · Name supplied by responder`
              : summary.responderVerificationMethod === 'EMERGENCY_OVERRIDE'
                ? 'Unverified emergency override · Identity self-declared'
                : verification}
          </span>
          <span>Trace: {summary.accessTraceCode} · Device: {summary.responderDevice}</span>
        </div>

        <header className="summary-header">
          <p className="summary-eyebrow">MediPass emergency summary</p>
          {demographics?.fullName ? <h1 className="summary-name">{demographics.fullName}</h1> : (
            <h1 className="summary-name">Emergency medical summary</h1>
          )}
          {demographics ? (
            <p className="summary-demographics">
              {[age, demographics.gender].filter(Boolean).join(' · ')}
            </p>
          ) : null}
          <p className="summary-expiry">Access expires {formatExpiry(summary.expiresAt)}</p>
        </header>

        {allergies && allergies.length > 0 ? (
          <section className="summary-section summary-section--critical" aria-labelledby="allergies-heading">
            <h2 id="allergies-heading">Allergies</h2>
            <ul className="summary-list">
              {allergies.map((allergy) => (
                <li key={allergy.id} className="summary-list-item">
                  <span className="summary-list-primary">{allergy.substance}</span>
                  {allergy.reaction ? <span className="summary-list-secondary">{allergy.reaction}</span> : null}
                  {allergy.severity ? <span className="summary-badge">{allergy.severity}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {medications && medications.length > 0 ? (
          <section className="summary-section" aria-labelledby="medications-heading">
            <h2 id="medications-heading">Medications</h2>
            <ul className="summary-list">
              {medications.map((medication) => (
                <li key={medication.id} className="summary-list-item">
                  <span className="summary-list-primary">{medication.name}</span>
                  <span className="summary-list-secondary">
                    {[medication.dosage, medication.frequency].filter(Boolean).join(' · ')}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {conditions && conditions.length > 0 ? (
          <section className="summary-section" aria-labelledby="conditions-heading">
            <h2 id="conditions-heading">Conditions</h2>
            <ul className="summary-list">
              {conditions.map((condition) => (
                <li key={condition.id} className="summary-list-item">
                  <span className="summary-list-primary">{condition.name}</span>
                  {condition.status ? <span className="summary-badge">{condition.status}</span> : null}
                  {condition.notes ? <span className="summary-list-secondary">{condition.notes}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {emergencyContact ? (
          <section className="summary-section summary-section--contact" aria-labelledby="contact-heading">
            <h2 id="contact-heading">Emergency contact</h2>
            <p className="summary-contact-name">
              {emergencyContact.name ?? 'Not provided'}
              {emergencyContact.relationship ? ` · ${emergencyContact.relationship}` : ''}
            </p>
            {emergencyContact.phone ? (
              <a className="summary-contact-phone" href={`tel:${emergencyContact.phone}`}>
                Call {emergencyContact.phone}
              </a>
            ) : null}
          </section>
        ) : null}

        {!allergies?.length && !medications?.length && !conditions?.length && !emergencyContact ? (
          <p className="summary-empty">
            The patient has not shared any emergency details beyond what is shown above.
          </p>
        ) : null}

        <footer className="summary-footer">
          <p>This view is logged for the patient&apos;s security audit trail.</p>
        </footer>
      </main>

      <div className="print-blocked">
        Printing of MediPass emergency information is disabled.
      </div>
    </div>
  )
}
