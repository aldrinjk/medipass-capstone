import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EmergencySummaryPage } from './EmergencySummaryPage'
import type { PublicPassSummary } from '../api/types'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderAtToken(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/passes/${token}`]}>
      <Routes>
        <Route path="/passes/:token" element={<EmergencySummaryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EmergencySummaryPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders only the categories the backend returned for an active, restricted pass', async () => {
    const summary: PublicPassSummary = {
      passId: 'p1',
      expiresAt: '2099-01-01T00:00:00Z',
      categories: ['ALLERGIES'],
      demographics: null,
      allergies: [{ id: 'a1', substance: 'Peanuts', reaction: 'Hives', severity: 'Moderate' }],
      medications: null,
      conditions: null,
      emergencyContact: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, summary)))

    renderAtToken('good-token')

    expect(await screen.findByText('Peanuts')).toBeInTheDocument()
    expect(screen.queryByText('Medications')).not.toBeInTheDocument()
    expect(screen.queryByText('Conditions')).not.toBeInTheDocument()
    expect(screen.queryByText('Emergency contact')).not.toBeInTheDocument()
  })

  it('shows a generic invalid-link screen for a 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(404, {
          timestamp: '2030-01-01T00:00:00Z',
          status: 404,
          code: 'PUBLIC_PASS_NOT_FOUND',
          message: 'not found',
          path: '/api/v1/public/passes/bad-token',
        }),
      ),
    )

    renderAtToken('bad-token')

    expect(await screen.findByText('Link not recognized')).toBeInTheDocument()
  })

  it('shows an expired-specific screen for a 410 with the expired code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(410, {
          timestamp: '2030-01-01T00:00:00Z',
          status: 410,
          code: 'PUBLIC_PASS_EXPIRED',
          message: 'expired',
          path: '/api/v1/public/passes/old-token',
        }),
      ),
    )

    renderAtToken('old-token')

    expect(await screen.findByText('This pass has expired')).toBeInTheDocument()
  })

  it('shows a revoked-specific screen for a 410 with the revoked code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(410, {
          timestamp: '2030-01-01T00:00:00Z',
          status: 410,
          code: 'PUBLIC_PASS_REVOKED',
          message: 'revoked',
          path: '/api/v1/public/passes/revoked-token',
        }),
      ),
    )

    renderAtToken('revoked-token')

    expect(await screen.findByText('Access no longer available')).toBeInTheDocument()
  })

  it('shows a retryable connection error screen when the network request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    renderAtToken('any-token')

    expect(await screen.findByText("Can't reach MediPass")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('never persists the scanned token to localStorage or sessionStorage', async () => {
    const summary: PublicPassSummary = {
      passId: 'p1',
      expiresAt: '2099-01-01T00:00:00Z',
      categories: ['ALLERGIES'],
      demographics: null,
      allergies: [{ id: 'a1', substance: 'Peanuts', reaction: null, severity: null }],
      medications: null,
      conditions: null,
      emergencyContact: null,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, summary)))

    renderAtToken('super-secret-token')
    await screen.findByText('Peanuts')

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
