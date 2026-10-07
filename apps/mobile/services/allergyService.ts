import { apiClient, isMockEnabled } from './apiClient';
import { Allergy, AllergyInput } from '../types';
import { MOCK_ALLERGIES } from './mockData';

let localAllergies: Allergy[] = [...MOCK_ALLERGIES];

export const allergyService = {
  async getAllergies(): Promise<Allergy[]> {
    if (isMockEnabled()) {
      return [...localAllergies];
    }
    const response = await apiClient.get<Allergy[]>('/api/v1/patients/me/allergies');
    localAllergies = response.data;
    return response.data;
  },

  async createAllergy(input: AllergyInput): Promise<Allergy> {
    if (isMockEnabled()) {
      const newAllergy: Allergy = {
        id: `all-${Date.now()}`,
        substance: input.substance,
        reaction: input.reaction,
        severity: input.severity,
      };
      localAllergies.push(newAllergy);
      return newAllergy;
    }
    const response = await apiClient.post<Allergy>('/api/v1/patients/me/allergies', input);
    localAllergies.push(response.data);
    return response.data;
  },

  async updateAllergy(id: string, input: AllergyInput): Promise<Allergy> {
    if (isMockEnabled()) {
      let updated: Allergy | undefined;
      localAllergies = localAllergies.map((a) => {
        if (a.id === id) {
          updated = {
            id,
            substance: input.substance,
            reaction: input.reaction,
            severity: input.severity,
          };
          return updated;
        }
        return a;
      });
      return (
        updated ?? {
          id,
          substance: input.substance,
          reaction: input.reaction,
          severity: input.severity,
        }
      );
    }
    const response = await apiClient.put<Allergy>(`/api/v1/patients/me/allergies/${id}`, input);
    localAllergies = localAllergies.map((a) => (a.id === id ? response.data : a));
    return response.data;
  },

  async deleteAllergy(id: string): Promise<void> {
    if (isMockEnabled()) {
      localAllergies = localAllergies.filter((a) => a.id !== id);
      return;
    }
    await apiClient.delete(`/api/v1/patients/me/allergies/${id}`);
    localAllergies = localAllergies.filter((a) => a.id !== id);
  },
};
