/**
 * Mirrors docs/api/openapi.yaml and apps/api's pass DTOs exactly
 * (apps/api/src/main/java/com/medipass/pass/*.java,
 * apps/api/src/main/java/com/medipass/sharing/ShareCategory.java).
 * Do not rename these locally -- the API contract is frozen.
 */

export const SHARE_CATEGORIES = [
  'DEMOGRAPHICS',
  'ALLERGIES',
  'MEDICATIONS',
  'CONDITIONS',
  'EMERGENCY_CONTACT',
] as const;

export type ShareCategory = (typeof SHARE_CATEGORIES)[number];

export type PassStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

/** POST /api/v1/passes request body. */
export interface CreatePassRequest {
  categories: ShareCategory[];
  expiresAt: string; // ISO instant, must be in the future
}

/** POST /api/v1/passes 201 response body. */
export interface CreatePassResponse {
  passId: string;
  status: PassStatus;
  expiresAt: string;
  publicUrl: string;
  categories: ShareCategory[];
}

/** GET /api/v1/passes and GET /api/v1/passes/{passId} response body. */
export interface PassMetadata {
  passId: string;
  status: PassStatus;
  expiresAt: string;
  categories: ShareCategory[];
  createdAt: string;
  revokedAt: string | null;
}

/** POST /api/v1/passes/{passId}/rotate response body. */
export interface RotatePassResponse {
  passId: string;
  status: PassStatus;
  expiresAt: string;
  publicUrl: string;
  categories: ShareCategory[];
}
