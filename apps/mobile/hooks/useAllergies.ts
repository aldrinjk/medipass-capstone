import { useState, useEffect, useCallback } from 'react';
import { allergyService } from '../services/allergyService';
import { Allergy, AllergyInput } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function useAllergies() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllergies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await allergyService.getAllergies();
      setAllergies(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAllergy = async (input: AllergyInput): Promise<boolean> => {
    try {
      await allergyService.createAllergy(input);
      await loadAllergies();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const updateAllergy = async (id: string, input: AllergyInput): Promise<boolean> => {
    try {
      await allergyService.updateAllergy(id, input);
      await loadAllergies();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const deleteAllergy = async (id: string): Promise<boolean> => {
    try {
      await allergyService.deleteAllergy(id);
      await loadAllergies();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  useEffect(() => {
    loadAllergies();
  }, [loadAllergies]);

  return {
    allergies,
    isLoading,
    error,
    loadAllergies,
    createAllergy,
    updateAllergy,
    deleteAllergy,
  };
}
