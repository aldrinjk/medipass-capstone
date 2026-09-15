import { apiClient, isMockEnabled } from './apiClient';
import { SharingPreferences, ShareCategory } from '../types';
import { MOCK_SHARING_PREFERENCES } from './mockData';

let localSharingPreferences: SharingPreferences = { ...MOCK_SHARING_PREFERENCES };

export const sharingService = {
  async getSharingPreferences(): Promise<SharingPreferences> {
    if (isMockEnabled()) {
      return { ...localSharingPreferences };
    }
    const response = await apiClient.get<SharingPreferences>(
      '/api/v1/patients/me/sharing-preferences'
    );
    localSharingPreferences = response.data;
    return response.data;
  },

  async updateSharingPreferences(categories: ShareCategory[]): Promise<SharingPreferences> {
    if (isMockEnabled()) {
      localSharingPreferences = { categories };
      return { ...localSharingPreferences };
    }
    const response = await apiClient.put<SharingPreferences>(
      '/api/v1/patients/me/sharing-preferences',
      { categories }
    );
    localSharingPreferences = response.data;
    return response.data;
  },
};
