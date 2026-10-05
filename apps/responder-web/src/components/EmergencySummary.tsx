import type { PublicPassSummary } from '../api/types'
import { formatAge, formatExpiry } from '../utils/formatters'

interface EmergencySummaryProps {
  summary: PublicPassSummary
}

/**
 * Renders exactly the fields the backend returned -- nothing more.
 * A field/section is omitted whenever the corresponding data is
 * null/empty; this component never fetches or infers hidden categories
 * (see docs/team-handoffs section 6.5).
 */
export function EmergencySummary({ summary }: EmergencySummaryProps) {
  const { demographics, allergies, medications, conditions, emergencyContact } = summary
  const age = demographics ? formatAge(demographics.birthDate) : null

  return (
    <main className="summary" aria-label="Emergency medical summary">
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
  )
}
