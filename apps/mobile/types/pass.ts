import { ShareCategory } from './sharing';

export type PassStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface PassSummary {
  passId: string;
  status: PassStatus;
  createdAt?: string;
  expiresAt: string;
  publicUrl: string;
  categories: ShareCategory[];
}

export interface CreatePassRequest {
  categories: ShareCategory[];
  expiresAt: string;
}

export type AccessAuditStatus = 'SUCCESS' | 'EXPIRED' | 'REVOKED' | 'INVALID';

export interface PassAuditLog {
  id?: string;
  passId: string;
  timestamp: string;
  accessStatus: AccessAuditStatus;
  ipAddressTruncated?: string;
  userAgent?: string;
}
