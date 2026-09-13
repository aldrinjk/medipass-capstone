import { apiClient } from './apiClient';
import {
  PassSummary,
  CreatePassRequest,
  PassAuditLog,
  ShareCategory,
} from '../types';
import { MOCK_PASSES, MOCK_AUDIT_LOGS } from './mockData';

let localPasses: PassSummary[] = MOCK_PASSES ? [...MOCK_PASSES] : [];

export const passService = {
  async getPasses(): Promise<PassSummary[]> {
    try {
      const response = await apiClient.get<PassSummary[]>('/api/v1/passes');
      if (response && response.data) {
        localPasses = response.data;
        return response.data;
      }
      return [...(localPasses || [])];
    } catch (err) {
      return [...(localPasses || [])];
    }
  },

  async createPass(categories: ShareCategory[], expiresInHours: number = 24): Promise<PassSummary> {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
    const payload: CreatePassRequest = { categories, expiresAt };

    try {
      const response = await apiClient.post<PassSummary>('/api/v1/passes', payload);
      if (response && response.data) {
        localPasses = localPasses || [];
        localPasses.unshift(response.data);
        return response.data;
      }
      throw new Error('No data');
    } catch {
      const passId = `pass-${Math.random().toString(36).substring(2, 8)}`;
      const mockPass: PassSummary = {
        passId,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        expiresAt,
        publicUrl: `https://medipass.health/p/${passId}`,
        categories,
      };
      localPasses = localPasses || [];
      localPasses.unshift(mockPass);
      return mockPass;
    }
  },

  async revokePass(passId: string): Promise<PassSummary> {
    try {
      const response = await apiClient.post<PassSummary>(`/api/v1/passes/${passId}/revoke`);
      if (response && response.data) {
        localPasses = (localPasses || []).map((p) => (p.passId === passId ? response.data : p));
        return response.data;
      }
      throw new Error('No data');
    } catch {
      let revoked: PassSummary | undefined;
      localPasses = (localPasses || []).map((p) => {
        if (p.passId === passId) {
          revoked = { ...p, status: 'REVOKED' };
          return revoked;
        }
        return p;
      });
      return revoked ?? {
        passId,
        status: 'REVOKED',
        expiresAt: new Date().toISOString(),
        publicUrl: '',
        categories: [],
      };
    }
  },

  async rotatePass(passId: string): Promise<PassSummary> {
    try {
      const response = await apiClient.post<PassSummary>(`/api/v1/passes/${passId}/rotate`);
      if (response && response.data) {
        localPasses = (localPasses || []).map((p) => (p.passId === passId ? response.data : p));
        return response.data;
      }
      throw new Error('No data');
    } catch {
      let rotated: PassSummary | undefined;
      localPasses = (localPasses || []).map((p) => {
        if (p.passId === passId) {
          rotated = {
            ...p,
            status: 'ACTIVE',
            publicUrl: `https://medipass.health/p/${passId}-rotated`,
          };
          return rotated;
        }
        return p;
      });
      return (
        rotated ?? {
          passId,
          status: 'ACTIVE',
          expiresAt: new Date().toISOString(),
          publicUrl: `https://medipass.health/p/${passId}-rotated`,
          categories: [],
        }
      );
    }
  },

  async getPatientAccessLogs(): Promise<PassAuditLog[]> {
    try {
      const response = await apiClient.get<any[]>('/api/v1/patients/me/access-logs');
      if (response && response.data) {
        return response.data.map((log: any) => ({
          id: log.id,
          passId: log.passId,
          timestamp: log.accessedAt || log.timestamp,
          accessStatus: log.outcome || log.accessStatus,
        }));
      }
      return Object.values(MOCK_AUDIT_LOGS).flat();
    } catch {
      return Object.values(MOCK_AUDIT_LOGS).flat();
    }
  },

  async getPassAuditLogs(passId: string): Promise<PassAuditLog[]> {
    try {
      const allLogs = await this.getPatientAccessLogs();
      const filtered = allLogs.filter((l) => l.passId === passId);
      if (filtered.length > 0) return filtered;
      return MOCK_AUDIT_LOGS[passId] ?? [];
    } catch {
      return MOCK_AUDIT_LOGS[passId] ?? [];
    }
  },
};
