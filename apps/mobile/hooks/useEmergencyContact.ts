import { useState, useEffect, useCallback } from 'react';
import { emergencyContactService } from '../services/emergencyContactService';
import { EmergencyContact, EmergencyContactInput } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function useEmergencyContact() {
  const [contact, setContact] = useState<EmergencyContact | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmergencyContact = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await emergencyContactService.getEmergencyContact();
      setContact(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateEmergencyContact = async (input: EmergencyContactInput): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await emergencyContactService.updateEmergencyContact(input);
      setContact(updated);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencyContact();
  }, [loadEmergencyContact]);

  return {
    contact,
    isLoading,
    error,
    loadEmergencyContact,
    updateEmergencyContact,
  };
}
