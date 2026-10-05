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
import { clearCachedPublicUrl, getCachedPublicUrl, setCachedPublicUrl } from '../services/passUrlCache';

export function usePasses() {
  const [passes, setPasses] = useState<PassMetadata[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, AccessLogResponse[]>>({});
  const [publicUrls, setPublicUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const rememberPublicUrl = async (passId: string, publicUrl: string) => {
    setPublicUrls((prev) => ({ ...prev, [passId]: publicUrl }));
    await setCachedPublicUrl(passId, publicUrl);
  };

  const loadPasses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await passService.getPasses();
      setPasses(data);

      const restoredEntries = await Promise.all(
        data.map(async (pass) => {
          if (pass.status !== 'ACTIVE') {
            await clearCachedPublicUrl(pass.passId);
            return null;
          }
          const url = await getCachedPublicUrl(pass.passId);
          return url ? ([pass.passId, url] as const) : null;
        })
      );
      setPublicUrls(
        Object.fromEntries(restoredEntries.filter((entry): entry is readonly [string, string] => entry !== null))
      );
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
      await rememberPublicUrl(newPass.passId, newPass.publicUrl);
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
      await clearCachedPublicUrl(passId);
      setPublicUrls((prev) => {
        const next = { ...prev };
        delete next[passId];
        return next;
      });
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
      await rememberPublicUrl(updated.passId, updated.publicUrl);
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
    } catch (err) {
      setError(getErrorMessage(err));
      return [];
    }
  };

  const loadAccessLogDetail = async (logId: string): Promise<AccessLogResponse | null> => {
    try {
      return await passService.getAccessLog(logId);
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
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
    loadAccessLogDetail,
  };
}
