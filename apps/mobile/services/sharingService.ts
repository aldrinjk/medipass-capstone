import { apiClient } from './apiClient';
import { SharingPreferences, ShareCategory } from '../types';
import { MOCK_SHARING_PREFERENCES } from './mockData';

let localSharingPreferences: SharingPreferences = MOCK_SHARING_PREFERENCES
  ? { ...MOCK_SHARING_PREFERENCES }
  : { categories: ['DEMOGRAPHICS', 'ALLERGIES', 'MEDICATIONS', 'CONDITIONS', 'EMERGENCY_CONTACT'] };

export const sharingService = {
  async getSharingPreferences(): Promise<SharingPreferences> {
    try {
      const response = await apiClient.get<SharingPreferences>(
        '/api/v1/patients/me/sharing-preferences'
      );
      if (response && response.data) {
        localSharingPreferences = response.data;
        return response.data;
      }
      return { ...localSharingPreferences };
    } catch {
      return { ...localSharingPreferences };
    }
  },

  async updateSharingPreferences(categories: ShareCategory[]): Promise<SharingPreferences> {
    try {
      const response = await apiClient.put<SharingPreferences>(
        '/api/v1/patients/me/sharing-preferences',
        { categories }
      );
      if (response && response.data) {
        localSharingPreferences = response.data;
        return response.data;
      }
      localSharingPreferences = { categories };
      return { ...localSharingPreferences };
    } catch {
      localSharingPreferences = { categories };
      return { ...localSharingPreferences };
    }
  },
};
