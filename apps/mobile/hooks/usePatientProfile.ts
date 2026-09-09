import { useState, useEffect, useCallback } from 'react';
import { patientService } from '../services/patientService';
import { PatientProfile, UpdatePatientProfileRequest } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function usePatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await patientService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = async (updates: UpdatePatientProfileRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await patientService.updateProfile(updates);
      setProfile(updated);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
  };
}
