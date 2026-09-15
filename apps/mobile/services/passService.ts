import { apiClient, isMockEnabled } from './apiClient';
import {
  PassMetadata,
  CreatePassResponse,
  RotatePassResponse,
  CreatePassRequest,
  AccessLogResponse,
  ShareCategory,
} from '../types';
import { MOCK_PASSES, MOCK_AUDIT_LOGS } from './mockData';

let localPasses: PassMetadata[] = [...MOCK_PASSES];

export const passService = {
  async getPasses(): Promise<PassMetadata[]> {
    if (isMockEnabled()) {
      return [...localPasses];
    }
    const response = await apiClient.get<PassMetadata[]>('/api/v1/passes');
    localPasses = response.data;
    return response.data;
  },

  async createPass(
    categories: ShareCategory[],
    expiresInHours: number = 24
  ): Promise<CreatePassResponse> {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
    const payload: CreatePassRequest = { categories, expiresAt };

    if (isMockEnabled()) {
      const passId = `pass-${Math.random().toString(36).substring(2, 8)}`;
      const mockCreated: CreatePassResponse = {
        passId,
        status: 'ACTIVE',
        expiresAt,
        publicUrl: `https://medipass.health/p/${passId}`,
        categories,
      };
      const newMetadata: PassMetadata = {
        passId,
        status: 'ACTIVE',
        expiresAt,
        categories,
        createdAt: new Date().toISOString(),
      };
      localPasses.unshift(newMetadata);
      return mockCreated;
    }

    const response = await apiClient.post<CreatePassResponse>('/api/v1/passes', payload);
    return response.data;
  },

  async revokePass(passId: string): Promise<PassMetadata> {
    if (isMockEnabled()) {
      let revoked: PassMetadata | undefined;
      localPasses = localPasses.map((p) => {
        if (p.passId === passId) {
          revoked = { ...p, status: 'REVOKED', revokedAt: new Date().toISOString() };
          return revoked;
        }
        return p;
      });
      return (
        revoked ?? {
          passId,
          status: 'REVOKED',
          expiresAt: new Date().toISOString(),
          categories: [],
          createdAt: new Date().toISOString(),
          revokedAt: new Date().toISOString(),
        }
      );
    }

    const response = await apiClient.post<PassMetadata>(`/api/v1/passes/${passId}/revoke`);
    return response.data;
  },

  async rotatePass(passId: string): Promise<RotatePassResponse> {
    if (isMockEnabled()) {
      const rotatedUrl = `https://medipass.health/p/${passId}-rotated`;
      localPasses = localPasses.map((p) => {
        if (p.passId === passId) {
          return {
            ...p,
            status: 'ACTIVE',
          };
        }
        return p;
      });
      const current = localPasses.find((p) => p.passId === passId);
      return {
        passId,
        status: 'ACTIVE',
        expiresAt: current?.expiresAt ?? new Date().toISOString(),
        publicUrl: rotatedUrl,
        categories: current?.categories ?? [],
      };
    }

    const response = await apiClient.post<RotatePassResponse>(`/api/v1/passes/${passId}/rotate`);
    return response.data;
  },

  async getPatientAccessLogs(): Promise<AccessLogResponse[]> {
    if (isMockEnabled()) {
      return Object.values(MOCK_AUDIT_LOGS).flat();
    }
    const response = await apiClient.get<AccessLogResponse[]>('/api/v1/patients/me/access-logs');
    return response.data;
  },

  async getPassAuditLogs(passId: string): Promise<AccessLogResponse[]> {
    const allLogs = await this.getPatientAccessLogs();
    return allLogs.filter((l) => l.passId === passId);
  },
};
