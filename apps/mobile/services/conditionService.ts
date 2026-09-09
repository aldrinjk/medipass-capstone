import { apiClient } from './apiClient';
import { Condition, ConditionInput } from '../types';
import { MOCK_CONDITIONS } from './mockData';

let localConditions: Condition[] = [...MOCK_CONDITIONS];

export const conditionService = {
  async getConditions(): Promise<Condition[]> {
    try {
      const response = await apiClient.get<Condition[]>('/api/v1/patients/me/conditions');
      localConditions = response.data;
      return response.data;
    } catch {
      return [...localConditions];
    }
  },

  async createCondition(input: ConditionInput): Promise<Condition> {
    try {
      const response = await apiClient.post<Condition>('/api/v1/patients/me/conditions', input);
      localConditions.push(response.data);
      return response.data;
    } catch {
      const newCondition: Condition = {
        id: `con-${Date.now()}`,
        ...input,
      };
      localConditions.push(newCondition);
      return newCondition;
    }
  },

  async updateCondition(id: string, input: ConditionInput): Promise<Condition> {
    try {
      const response = await apiClient.put<Condition>(`/api/v1/patients/me/conditions/${id}`, input);
      localConditions = localConditions.map((c) => (c.id === id ? response.data : c));
      return response.data;
    } catch {
      let updated: Condition | undefined;
      localConditions = localConditions.map((c) => {
        if (c.id === id) {
          updated = { ...c, ...input };
          return updated;
        }
        return c;
      });
      return updated ?? { id, ...input };
    }
  },

  async deleteCondition(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/patients/me/conditions/${id}`);
    } catch {
      // simulated deletion for local demo
    }
    localConditions = localConditions.filter((c) => c.id !== id);
  },
};
