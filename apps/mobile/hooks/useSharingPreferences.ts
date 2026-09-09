import { useState, useEffect, useCallback } from 'react';
import { sharingService } from '../services/sharingService';
import { ShareCategory } from '../types';
import { getErrorMessage } from '../services/apiClient';

export function useSharingPreferences() {
  const [categories, setCategories] = useState<ShareCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await sharingService.getSharingPreferences();
      setCategories(data.categories);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCategory = (category: ShareCategory) => {
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
    setSuccessMessage(null);
  };

  const savePreferences = async (customCategories?: ShareCategory[]): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const toSave = customCategories ?? categories;
      const data = await sharingService.updateSharingPreferences(toSave);
      setCategories(data.categories);
      setSuccessMessage('Sharing preferences updated successfully');
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    categories,
    isLoading,
    isSaving,
    error,
    successMessage,
    loadPreferences,
    toggleCategory,
    savePreferences,
  };
}
