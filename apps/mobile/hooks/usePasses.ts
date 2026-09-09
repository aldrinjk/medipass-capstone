import { useState, useEffect, useCallback } from 'react';
import { passService } from '../services/passService';
import { PassSummary, PassAuditLog, ShareCategory } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function usePasses() {
  const [passes, setPasses] = useState<PassSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, PassAuditLog[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await passService.getPasses();
      setPasses(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPass = async (
    categories: ShareCategory[],
    expiresInHours: number = 24
  ): Promise<PassSummary | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newPass = await passService.createPass(categories, expiresInHours);
      await loadPasses();
      return newPass;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const revokePass = async (passId: string): Promise<boolean> => {
    try {
      await passService.revokePass(passId);
      await loadPasses();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const loadAuditLogs = async (passId: string): Promise<PassAuditLog[]> => {
    try {
      const logs = await passService.getPassAuditLogs(passId);
      setAuditLogs((prev) => ({ ...prev, [passId]: logs }));
      return logs;
    } catch {
      return [];
    }
  };

  useEffect(() => {
    loadPasses();
  }, [loadPasses]);

  return {
    passes,
    auditLogs,
    isLoading,
    error,
    loadPasses,
    createPass,
    revokePass,
    loadAuditLogs,
  };
}
