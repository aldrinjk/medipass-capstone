/**
 * Mirrors docs/api/openapi.yaml and apps/api's pass/patient DTOs exactly.
 * Do not rename these fields locally -- they must match the API contract.
 */

export type ShareCategory =
  | 'DEMOGRAPHICS'
  | 'ALLERGIES'
  | 'MEDICATIONS'
  | 'CONDITIONS'
  | 'EMERGENCY_CONTACT'

export type ResponderVerificationMethod =
  | 'PHONE_OTP'
  | 'EMERGENCY_OVERRIDE'
  | 'AADHAAR_OFFLINE'
  | 'ORGANIZATION_SSO'
  | 'PASSKEY'

export interface Demographics {
  fullName: string | null
  birthDate: string | null
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

export interface PublicPassSummary {
  passId: string
  expiresAt: string
  categories: ShareCategory[]
  demographics: Demographics | null
  allergies: Allergy[] | null
  medications: Medication[] | null
  conditions: Condition[] | null
  emergencyContact: EmergencyContact | null
  accessTraceCode: string
  responderDevice: string
  responderName: string
  responderRole: string | null
  responderOrganization: string | null
  responderPhoneLast4: string | null
  responderVerificationMethod: ResponderVerificationMethod
  responderVerificationNote?: string | null
}

export interface ResponderVerificationStartResponse {
  challengeId: string
  maskedPhone: string
  expiresAt: string
  deliveryMode: 'DEVELOPMENT' | 'SMS' | string
  developmentCode?: string | null
}

export interface ResponderVerificationSessionResponse {
  verificationToken: string
  verificationMethod: ResponderVerificationMethod
  responderName: string
  maskedPhone?: string | null
  expiresAt: string
}

export interface ApiErrorBody {
  timestamp: string
  status: number
  code: string
  message: string
  path: string
  validationErrors?: Record<string, string>
}
