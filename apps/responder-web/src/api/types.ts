/**
 * Mirrors docs/api/openapi.yaml and apps/api's pass/patient DTOs exactly.
 * Do not rename these fields locally -- they must match the frozen API contract.
 */

export type ShareCategory =
  | 'DEMOGRAPHICS'
  | 'ALLERGIES'
  | 'MEDICATIONS'
  | 'CONDITIONS'
  | 'EMERGENCY_CONTACT'

export interface Demographics {
  fullName: string | null
  birthDate: string | null // ISO date (yyyy-MM-dd)
  gender: string | null
  phone: string | null
}

export interface Allergy {
  id: string
  substance: string
  reaction: string | null
  severity: string | null
}

export interface Medication {
  id: string
  name: string
  dosage: string | null
  frequency: string | null
}

export interface Condition {
  id: string
  name: string
  status: string | null
  notes: string | null
}

export interface EmergencyContact {
  name: string | null
  relationship: string | null
  phone: string | null
}

/** GET /api/v1/public/passes/{token} 200 response body. */
export interface PublicPassSummary {
  passId: string
  expiresAt: string // ISO instant
  categories: ShareCategory[]
  demographics: Demographics | null
  allergies: Allergy[] | null
  medications: Medication[] | null
  conditions: Condition[] | null
  emergencyContact: EmergencyContact | null
}

/** Shared API error envelope returned by the Spring Boot backend. */
export interface ApiErrorBody {
  timestamp: string
  status: number
  code: string
  message: string
  path: string
  validationErrors?: Record<string, string>
}
