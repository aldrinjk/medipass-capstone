import { apiClient } from './apiClient';
import { EmergencyContact, EmergencyContactInput } from '../types';
import { MOCK_EMERGENCY_CONTACT } from './mockData';

let localEmergencyContact: EmergencyContact = { ...MOCK_EMERGENCY_CONTACT };

export const emergencyContactService = {
  async getEmergencyContact(): Promise<EmergencyContact> {
    try {
      const response = await apiClient.get<EmergencyContact>('/api/v1/patients/me/emergency-contact');
      localEmergencyContact = response.data;
      return response.data;
    } catch {
      return { ...localEmergencyContact };
    }
  },

  async updateEmergencyContact(input: EmergencyContactInput): Promise<EmergencyContact> {
    try {
      const response = await apiClient.put<EmergencyContact>(
        '/api/v1/patients/me/emergency-contact',
        input
      );
      localEmergencyContact = response.data;
      return response.data;
    } catch {
      localEmergencyContact = {
        ...localEmergencyContact,
        ...input,
      };
      return { ...localEmergencyContact };
    }
  },
};
