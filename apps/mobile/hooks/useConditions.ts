import { useState, useEffect, useCallback } from 'react';
import { conditionService } from '../services/conditionService';
import { Condition, ConditionInput } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function useConditions() {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadConditions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await conditionService.getConditions();
      setConditions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCondition = async (input: ConditionInput): Promise<boolean> => {
    setError(null);
    try {
      const created = await conditionService.createCondition(input);
      setConditions((current) => [...current, created]);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const updateCondition = async (id: string, input: ConditionInput): Promise<boolean> => {
    setError(null);
    try {
      const updated = await conditionService.updateCondition(id, input);
      setConditions((current) =>
        current.map((condition) => (condition.id === id ? updated : condition))
      );
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  const deleteCondition = async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await conditionService.deleteCondition(id);
      setConditions((current) => current.filter((condition) => condition.id !== id));
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    }
  };

  useEffect(() => {
    loadConditions();
  }, [loadConditions]);

  return {
    conditions,
    isLoading,
    error,
    loadConditions,
    createCondition,
    updateCondition,
    deleteCondition,
  };
}
