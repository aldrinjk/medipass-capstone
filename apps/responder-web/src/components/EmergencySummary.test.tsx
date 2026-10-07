import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmergencySummary } from './EmergencySummary'
import type { PublicPassSummary } from '../api/types'

describe('EmergencySummary forensic watermark', () => {
  it('renders responder, full verified phone, and trace as separate readable watermark lines', () => {
    const summary: PublicPassSummary = {
      passId: 'p1',
      expiresAt: '2099-01-01T00:00:00Z',
      categories: ['ALLERGIES'],
      demographics: {
        fullName: 'Demo Patient',
        birthDate: '2000-05-15',
        gender: 'male',
        phone: null,
      },
      allergies: [{ id: 'a1', substance: 'Peanuts', reaction: 'Hives', severity: 'Moderate' }],
      medications: null,
      conditions: null,
      emergencyContact: null,
      accessTraceCode: 'MP-TESTTRACE000001',
      responderDevice: 'iPhone · Safari',
      responderName: 'Responder1',
      responderRole: 'Paramedic',
      responderOrganization: 'Hospital',
      responderPhoneLast4: '2580',
      responderVerificationMethod: 'PHONE_OTP',
      responderVerificationNote: 'Development OTP simulation; no SMS was sent.',
    }

    render(
      <EmergencySummary
        summary={summary}
        verifiedPhoneForWatermark="+919876542580"
      />,
    )

    expect(screen.getAllByText('MEDIPASS · Responder1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('+919876542580 · DEMO OTP FLOW').length).toBeGreaterThan(0)
    expect(screen.getAllByText('MP-TESTTRACE000001').length).toBeGreaterThan(0)
  })
})
