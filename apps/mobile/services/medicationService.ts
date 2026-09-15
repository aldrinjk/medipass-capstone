import { apiClient, isMockEnabled } from './apiClient';
import { Medication, MedicationInput } from '../types';
import { MOCK_MEDICATIONS } from './mockData';

let localMedications: Medication[] = [...MOCK_MEDICATIONS];

export const medicationService = {
  async getMedications(): Promise<Medication[]> {
    if (isMockEnabled()) {
      return [...localMedications];
    }
    const response = await apiClient.get<Medication[]>('/api/v1/patients/me/medications');
    localMedications = response.data;
    return response.data;
  },

  async createMedication(input: MedicationInput): Promise<Medication> {
    if (isMockEnabled()) {
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: input.name,
        dosage: input.dosage,
        frequency: input.frequency,
      };
      localMedications.push(newMed);
      return newMed;
    }
    const response = await apiClient.post<Medication>('/api/v1/patients/me/medications', input);
    localMedications.push(response.data);
    return response.data;
  },

  async updateMedication(id: string, input: MedicationInput): Promise<Medication> {
    if (isMockEnabled()) {
      let updated: Medication | undefined;
      localMedications = localMedications.map((m) => {
        if (m.id === id) {
          updated = {
            id,
            name: input.name,
            dosage: input.dosage,
            frequency: input.frequency,
          };
          return updated;
        }
        return m;
      });
      return (
        updated ?? {
          id,
          name: input.name,
          dosage: input.dosage,
          frequency: input.frequency,
        }
      );
    }
    const response = await apiClient.put<Medication>(`/api/v1/patients/me/medications/${id}`, input);
    localMedications = localMedications.map((m) => (m.id === id ? response.data : m));
    return response.data;
  },

  async deleteMedication(id: string): Promise<void> {
    if (isMockEnabled()) {
      localMedications = localMedications.filter((m) => m.id !== id);
      return;
    }
    await apiClient.delete(`/api/v1/patients/me/medications/${id}`);
    localMedications = localMedications.filter((m) => m.id !== id);
  },
};
