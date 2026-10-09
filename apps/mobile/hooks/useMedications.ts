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
    setError(null);
    try {
      const created = await medicationService.createMedication(input);
      setMedications((current) => [...current, created]);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const updateMedication = async (id: string, input: MedicationInput): Promise<boolean> => {
    setError(null);
    try {
      const updated = await medicationService.updateMedication(id, input);
      setMedications((current) =>
        current.map((medication) => (medication.id === id ? updated : medication))
      );
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const deleteMedication = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await medicationService.deleteMedication(id);
      setMedications((current) => current.filter((medication) => medication.id !== id));
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
