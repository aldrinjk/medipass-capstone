import { useState, useEffect, useCallback } from 'react';
import { passService } from '../services/passService';
import {
  PassMetadata,
  AccessLogResponse,
  ShareCategory,
  CreatePassResponse,
  RotatePassResponse,
} from '../types';
import { getErrorMessage } from '../services/apiClient';

export function usePasses() {
  const [passes, setPasses] = useState<PassMetadata[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, AccessLogResponse[]>>({});
  const [publicUrls, setPublicUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const rememberPublicUrl = (passId: string, publicUrl: string) => {
    setPublicUrls((prev) => ({ ...prev, [passId]: publicUrl }));
  };

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
  ): Promise<CreatePassResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newPass = await passService.createPass(categories, expiresInHours);
      rememberPublicUrl(newPass.passId, newPass.publicUrl);
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

  const rotatePass = async (passId: string): Promise<RotatePassResponse | null> => {
    try {
      const updated = await passService.rotatePass(passId);
      rememberPublicUrl(updated.passId, updated.publicUrl);
      await loadPasses();
      return updated;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    }
  };

  const loadAuditLogs = async (passId: string): Promise<AccessLogResponse[]> => {
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
    publicUrls,
    isLoading,
    error,
    loadPasses,
    createPass,
    revokePass,
    rotatePass,
    loadAuditLogs,
  };
}
