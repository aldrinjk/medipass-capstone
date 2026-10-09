import { apiClient, isMockEnabled } from './apiClient';
import { Medication, MedicationInput } from '../types';
import { MOCK_MEDICATIONS } from './mockData';

let localMedications: Medication[] = [...MOCK_MEDICATIONS];

const PENDING_CREATE_TTL_MS = 5 * 60 * 1000;
const pendingCreatedMedications = new Map<string, { item: Medication; createdAt: number }>();

function mergePendingCreates(serverItems: Medication[]): Medication[] {
  const serverIds = new Set(serverItems.map((item) => item.id));
  const now = Date.now();

  for (const [id, pending] of pendingCreatedMedications) {
    if (serverIds.has(id) || now - pending.createdAt > PENDING_CREATE_TTL_MS) {
      pendingCreatedMedications.delete(id);
    }
  }

  return [
    ...serverItems,
    ...Array.from(pendingCreatedMedications.values())
      .map(({ item }) => item)
      .filter((item) => !serverIds.has(item.id)),
  ];
}

export const medicationService = {
  async getMedications(): Promise<Medication[]> {
    if (isMockEnabled()) {
      return [...localMedications];
    }
    const response = await apiClient.get<Medication[]>('/api/v1/patients/me/medications');
    const merged = mergePendingCreates(response.data);
    localMedications = merged;
    return merged;
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
    pendingCreatedMedications.set(response.data.id, {
      item: response.data,
      createdAt: Date.now(),
    });
    localMedications = [
      ...localMedications.filter((item) => item.id !== response.data.id),
      response.data,
    ];
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
    const pending = pendingCreatedMedications.get(id);
    if (pending) {
      pendingCreatedMedications.set(id, { ...pending, item: response.data });
    }
    localMedications = localMedications.map((m) => (m.id === id ? response.data : m));
    return response.data;
  },

  async deleteMedication(id: string): Promise<void> {
    if (isMockEnabled()) {
      localMedications = localMedications.filter((m) => m.id !== id);
      return;
    }
    await apiClient.delete(`/api/v1/patients/me/medications/${id}`);
    pendingCreatedMedications.delete(id);
    localMedications = localMedications.filter((m) => m.id !== id);
  },
};
