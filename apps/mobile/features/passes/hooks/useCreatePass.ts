import { useCallback, useState } from 'react';
import * as passApi from '../api/passApi';
import { setCachedPublicUrl } from '../api/passUrlCache';
import { EXPIRY_OPTIONS, expiresAtFromHours } from '../utils/expiry';
import { ApiError } from '../../../services/apiClient';
import type { CreatePassResponse, ShareCategory } from '../../../types/pass';

interface UseCreatePassResult {
  selectedCategories: ShareCategory[];
  toggleCategory: (category: ShareCategory) => void;
  expiryHours: number;
  setExpiryHours: (hours: number) => void;
  submitting: boolean;
  error: string | null;
  submit: () => Promise<CreatePassResponse | null>;
  canSubmit: boolean;
}

export function useCreatePass(): UseCreatePassResult {
  const [selectedCategories, setSelectedCategories] = useState<ShareCategory[]>([]);
  const [expiryHours, setExpiryHours] = useState<number>(EXPIRY_OPTIONS[1]?.hours ?? 4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = useCallback((category: ShareCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  }, []);

  const submit = useCallback(async (): Promise<CreatePassResponse | null> => {
    if (selectedCategories.length === 0) {
      setError('Choose at least one category to share.');
      return null;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await passApi.createPass({
        categories: selectedCategories,
        expiresAt: expiresAtFromHours(expiryHours),
      });
      await setCachedPublicUrl(response.passId, response.publicUrl);
      return response;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the pass. Please try again.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [selectedCategories, expiryHours]);

  return {
    selectedCategories,
    toggleCategory,
    expiryHours,
    setExpiryHours,
    submitting,
    error,
    submit,
    canSubmit: selectedCategories.length > 0 && !submitting,
  };
}
