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
    setError(null);
    try {
      const created = await allergyService.createAllergy(input);
      setAllergies((current) => [...current, created]);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const updateAllergy = async (id: string, input: AllergyInput): Promise<boolean> => {
    setError(null);
    try {
      const updated = await allergyService.updateAllergy(id, input);
      setAllergies((current) =>
        current.map((allergy) => (allergy.id === id ? updated : allergy))
      );
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const deleteAllergy = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await allergyService.deleteAllergy(id);
      setAllergies((current) => current.filter((allergy) => allergy.id !== id));
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
