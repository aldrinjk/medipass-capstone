import { apiClient } from './apiClient';
import { Medication, MedicationInput } from '../types';
import { MOCK_MEDICATIONS } from './mockData';

let localMedications: Medication[] = [...MOCK_MEDICATIONS];

export const medicationService = {
  async getMedications(): Promise<Medication[]> {
    try {
      const response = await apiClient.get<Medication[]>('/api/v1/patients/me/medications');
      localMedications = response.data;
      return response.data;
    } catch {
      return [...localMedications];
    }
  },

  async createMedication(input: MedicationInput): Promise<Medication> {
    try {
      const response = await apiClient.post<Medication>('/api/v1/patients/me/medications', input);
      localMedications.push(response.data);
      return response.data;
    } catch {
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        name: input.name,
        dosage: input.dosage,
        frequency: input.frequency,
        route: input.route,
        instructions: input.instructions,
        status: input.status ?? 'ACTIVE',
      };
      localMedications.push(newMed);
      return newMed;
    }
  },

  async updateMedication(id: string, input: MedicationInput): Promise<Medication> {
    try {
      const response = await apiClient.put<Medication>(`/api/v1/patients/me/medications/${id}`, input);
      localMedications = localMedications.map((m) => (m.id === id ? response.data : m));
      return response.data;
    } catch {
      let updated: Medication | undefined;
      localMedications = localMedications.map((m) => {
        if (m.id === id) {
          updated = {
            ...m,
            name: input.name,
            dosage: input.dosage,
            frequency: input.frequency,
            route: input.route,
            instructions: input.instructions,
            status: input.status ?? m.status,
          };
          return updated;
        }
        return m;
      });
      return updated ?? {
        id,
        name: input.name,
        dosage: input.dosage,
        frequency: input.frequency,
        route: input.route,
        instructions: input.instructions,
        status: input.status ?? 'ACTIVE',
      };
    }
  },

  async deleteMedication(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/patients/me/medications/${id}`);
    } catch {
      // simulated deletion for local demo
    }
    localMedications = localMedications.filter((m) => m.id !== id);
  },
};
