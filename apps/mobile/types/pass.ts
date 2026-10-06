import { ShareCategory } from './sharing';

export type PassStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface PassMetadata {
  passId: string;
  status: PassStatus;
  expiresAt: string;
  categories: ShareCategory[];
  createdAt: string;
  revokedAt?: string | null;
}

export interface CreatePassResponse {
  passId: string;
  status: PassStatus;
  expiresAt: string;
  publicUrl: string;
  categories: ShareCategory[];
}

export interface RotatePassResponse {
  passId: string;
  status: PassStatus;
  expiresAt: string;
  publicUrl: string;
  categories: ShareCategory[];
}

export interface CreatePassRequest {
  categories: ShareCategory[];
  expiresAt: string;
}

export type AccessOutcome = 'SUCCESS' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export type ResponderVerificationMethod =
  | 'PHONE_OTP'
  | 'EMERGENCY_OVERRIDE'
  | 'AADHAAR_OFFLINE'
  | 'ORGANIZATION_SSO'
  | 'PASSKEY';

export interface AccessLogResponse {
  id: string;
  passId: string;
  outcome: AccessOutcome;
  traceCode?: string | null;
  responderDevice?: string | null;
  responderName?: string | null;
  responderRole?: string | null;
  responderOrganization?: string | null;
  responderPhoneLast4?: string | null;
  verificationMethod?: ResponderVerificationMethod | null;
  verificationNote?: string | null;
  accessedAt: string;
}

// Type alias for backwards compatibility
export type PassSummary = PassMetadata;
export type PassAuditLog = AccessLogResponse;
