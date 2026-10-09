import { apiClient, isMockEnabled } from './apiClient';
import { Condition, ConditionInput } from '../types';
import { MOCK_CONDITIONS } from './mockData';

let localConditions: Condition[] = [...MOCK_CONDITIONS];

const PENDING_CREATE_TTL_MS = 5 * 60 * 1000;
const pendingCreatedConditions = new Map<string, { item: Condition; createdAt: number }>();

function mergePendingCreates(serverItems: Condition[]): Condition[] {
  const serverIds = new Set(serverItems.map((item) => item.id));
  const now = Date.now();

  for (const [id, pending] of pendingCreatedConditions) {
    if (serverIds.has(id) || now - pending.createdAt > PENDING_CREATE_TTL_MS) {
      pendingCreatedConditions.delete(id);
    }
  }

  return [
    ...serverItems,
    ...Array.from(pendingCreatedConditions.values())
      .map(({ item }) => item)
      .filter((item) => !serverIds.has(item.id)),
  ];
}

export const conditionService = {
  async getConditions(): Promise<Condition[]> {
    if (isMockEnabled()) {
      return [...localConditions];
    }
    const response = await apiClient.get<Condition[]>('/api/v1/patients/me/conditions');
    const merged = mergePendingCreates(response.data);
    localConditions = merged;
    return merged;
  },

  async createCondition(input: ConditionInput): Promise<Condition> {
    if (isMockEnabled()) {
      const newCondition: Condition = {
        id: `con-${Date.now()}`,
        name: input.name,
        status: input.status,
        notes: input.notes,
      };
      localConditions.push(newCondition);
      return newCondition;
    }
    const response = await apiClient.post<Condition>('/api/v1/patients/me/conditions', input);
    pendingCreatedConditions.set(response.data.id, {
      item: response.data,
      createdAt: Date.now(),
    });
    localConditions = [
      ...localConditions.filter((item) => item.id !== response.data.id),
      response.data,
    ];
    return response.data;
  },

  async updateCondition(id: string, input: ConditionInput): Promise<Condition> {
    if (isMockEnabled()) {
      let updated: Condition | undefined;
      localConditions = localConditions.map((c) => {
        if (c.id === id) {
          updated = {
            id,
            name: input.name,
            status: input.status,
            notes: input.notes,
          };
          return updated;
        }
        return c;
      });
      return updated ?? { id, ...input };
    }
    const response = await apiClient.put<Condition>(`/api/v1/patients/me/conditions/${id}`, input);
    const pending = pendingCreatedConditions.get(id);
    if (pending) {
      pendingCreatedConditions.set(id, { ...pending, item: response.data });
    }
    localConditions = localConditions.map((c) => (c.id === id ? response.data : c));
    return response.data;
  },

  async deleteCondition(id: string): Promise<void> {
    if (isMockEnabled()) {
      localConditions = localConditions.filter((c) => c.id !== id);
      return;
    }
    await apiClient.delete(`/api/v1/patients/me/conditions/${id}`);
    pendingCreatedConditions.delete(id);
    localConditions = localConditions.filter((c) => c.id !== id);
  },
};
