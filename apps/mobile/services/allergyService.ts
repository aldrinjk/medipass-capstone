import { apiClient } from './apiClient';
import { Allergy, AllergyInput } from '../types';
import { MOCK_ALLERGIES } from './mockData';

let localAllergies: Allergy[] = [...MOCK_ALLERGIES];

export const allergyService = {
  async getAllergies(): Promise<Allergy[]> {
    try {
      const response = await apiClient.get<Allergy[]>('/api/v1/patients/me/allergies');
      localAllergies = response.data;
      return response.data;
    } catch {
      return [...localAllergies];
    }
  },

  async createAllergy(input: AllergyInput): Promise<Allergy> {
    try {
      const response = await apiClient.post<Allergy>('/api/v1/patients/me/allergies', input);
      localAllergies.push(response.data);
      return response.data;
    } catch {
      const newAllergy: Allergy = {
        id: `all-${Date.now()}`,
        substance: input.substance,
        severity: input.severity,
        reaction: input.reaction,
        status: input.status ?? 'ACTIVE',
        recordedDate: new Date().toISOString(),
      };
      localAllergies.push(newAllergy);
      return newAllergy;
    }
  },

  async updateAllergy(id: string, input: AllergyInput): Promise<Allergy> {
    try {
      const response = await apiClient.put<Allergy>(`/api/v1/patients/me/allergies/${id}`, input);
      localAllergies = localAllergies.map((a) => (a.id === id ? response.data : a));
      return response.data;
    } catch {
      let updated: Allergy | undefined;
      localAllergies = localAllergies.map((a) => {
        if (a.id === id) {
          updated = {
            ...a,
            substance: input.substance,
            severity: input.severity,
            reaction: input.reaction,
            status: input.status ?? a.status,
          };
          return updated;
        }
        return a;
      });
      return updated ?? {
        id,
        substance: input.substance,
        severity: input.severity,
        reaction: input.reaction,
        status: input.status ?? 'ACTIVE',
      };
    }
  },

  async deleteAllergy(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/patients/me/allergies/${id}`);
    } catch {
      // simulated deletion for local demo
    }
    localAllergies = localAllergies.filter((a) => a.id !== id);
  },
};
