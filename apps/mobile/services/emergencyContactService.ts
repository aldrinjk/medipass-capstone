import { apiClient, isMockEnabled } from './apiClient';
import { EmergencyContact, EmergencyContactInput } from '../types';
import { MOCK_EMERGENCY_CONTACT } from './mockData';

let localEmergencyContact: EmergencyContact = { ...MOCK_EMERGENCY_CONTACT };

export const emergencyContactService = {
  async getEmergencyContact(): Promise<EmergencyContact> {
    if (isMockEnabled()) {
      return { ...localEmergencyContact };
    }
    const response = await apiClient.get<EmergencyContact>('/api/v1/patients/me/emergency-contact');
    localEmergencyContact = response.data;
    return response.data;
  },

  async updateEmergencyContact(input: EmergencyContactInput): Promise<EmergencyContact> {
    if (isMockEnabled()) {
      localEmergencyContact = {
        ...localEmergencyContact,
        ...input,
      };
      return { ...localEmergencyContact };
    }
    const response = await apiClient.put<EmergencyContact>(
      '/api/v1/patients/me/emergency-contact',
      input
    );
    localEmergencyContact = response.data;
    return response.data;
  },
};
