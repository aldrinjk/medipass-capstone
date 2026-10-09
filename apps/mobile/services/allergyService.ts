import { apiClient, isMockEnabled } from './apiClient';
import { Allergy, AllergyInput } from '../types';
import { MOCK_ALLERGIES } from './mockData';

let localAllergies: Allergy[] = [...MOCK_ALLERGIES];

const PENDING_CREATE_TTL_MS = 5 * 60 * 1000;
const pendingCreatedAllergies = new Map<string, { item: Allergy; createdAt: number }>();

function mergePendingCreates(serverItems: Allergy[]): Allergy[] {
  const serverIds = new Set(serverItems.map((item) => item.id));
  const now = Date.now();

  for (const [id, pending] of pendingCreatedAllergies) {
    if (serverIds.has(id) || now - pending.createdAt > PENDING_CREATE_TTL_MS) {
      pendingCreatedAllergies.delete(id);
    }
  }

  return [
    ...serverItems,
    ...Array.from(pendingCreatedAllergies.values())
      .map(({ item }) => item)
      .filter((item) => !serverIds.has(item.id)),
  ];
}

export const allergyService = {
  async getAllergies(): Promise<Allergy[]> {
    if (isMockEnabled()) {
      return [...localAllergies];
    }
    const response = await apiClient.get<Allergy[]>('/api/v1/patients/me/allergies');
    const merged = mergePendingCreates(response.data);
    localAllergies = merged;
    return merged;
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
    pendingCreatedAllergies.set(response.data.id, {
      item: response.data,
      createdAt: Date.now(),
    });
    localAllergies = [
      ...localAllergies.filter((item) => item.id !== response.data.id),
      response.data,
    ];
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
    const pending = pendingCreatedAllergies.get(id);
    if (pending) {
      pendingCreatedAllergies.set(id, { ...pending, item: response.data });
    }
    localAllergies = localAllergies.map((a) => (a.id === id ? response.data : a));
    return response.data;
  },

  async deleteAllergy(id: string): Promise<void> {
    if (isMockEnabled()) {
      localAllergies = localAllergies.filter((a) => a.id !== id);
      return;
    }
    await apiClient.delete(`/api/v1/patients/me/allergies/${id}`);
    pendingCreatedAllergies.delete(id);
    localAllergies = localAllergies.filter((a) => a.id !== id);
  },
};
