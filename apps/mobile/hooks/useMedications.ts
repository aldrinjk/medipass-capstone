import { useState, useEffect, useCallback } from 'react';
import { medicationService } from '../services/medicationService';
import { Medication, MedicationInput } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await medicationService.getMedications();
      setMedications(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMedication = async (input: MedicationInput): Promise<boolean> => {
    try {
      await medicationService.createMedication(input);
      await loadMedications();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const updateMedication = async (id: string, input: MedicationInput): Promise<boolean> => {
    try {
      await medicationService.updateMedication(id, input);
      await loadMedications();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const deleteMedication = async (id: string): Promise<boolean> => {
    try {
      await medicationService.deleteMedication(id);
      await loadMedications();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  return {
    medications,
    isLoading,
    error,
    loadMedications,
    createMedication,
    updateMedication,
    deleteMedication,
  };
}
