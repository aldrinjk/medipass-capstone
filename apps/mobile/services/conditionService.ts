import { apiClient, isMockEnabled } from './apiClient';
import { Condition, ConditionInput } from '../types';
import { MOCK_CONDITIONS } from './mockData';

let localConditions: Condition[] = [...MOCK_CONDITIONS];

export const conditionService = {
  async getConditions(): Promise<Condition[]> {
    if (isMockEnabled()) {
      return [...localConditions];
    }
    const response = await apiClient.get<Condition[]>('/api/v1/patients/me/conditions');
    localConditions = response.data;
    return response.data;
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
    localConditions.push(response.data);
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
    localConditions = localConditions.map((c) => (c.id === id ? response.data : c));
    return response.data;
  },

  async deleteCondition(id: string): Promise<void> {
    if (isMockEnabled()) {
      localConditions = localConditions.filter((c) => c.id !== id);
      return;
    }
    await apiClient.delete(`/api/v1/patients/me/conditions/${id}`);
    localConditions = localConditions.filter((c) => c.id !== id);
  },
};
