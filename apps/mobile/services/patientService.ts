import { apiClient } from './apiClient';
import {
  PatientProfile,
  UpdatePatientProfileRequest,
  CategoryCompleteness,
} from '../types';
import { MOCK_PATIENT_PROFILE } from './mockData';

let localProfileCache: PatientProfile = { ...MOCK_PATIENT_PROFILE };

export const patientService = {
  async getProfile(): Promise<PatientProfile> {
    try {
      const response = await apiClient.get<PatientProfile>('/api/v1/patients/me');
      localProfileCache = response.data;
      return response.data;
    } catch {
      return localProfileCache;
    }
  },

  async updateProfile(updates: UpdatePatientProfileRequest): Promise<PatientProfile> {
    try {
      const response = await apiClient.put<PatientProfile>('/api/v1/patients/me', updates);
      localProfileCache = response.data;
      return response.data;
    } catch {
      localProfileCache = {
        ...localProfileCache,
        ...updates,
      };
      return localProfileCache;
    }
  },

  calculateCompleteness(
    profile: PatientProfile | null,
    allergiesCount: number,
    medicationsCount: number,
    conditionsCount: number,
    hasEmergencyContact: boolean
  ): CategoryCompleteness {
    const hasDemographics = Boolean(
      profile?.firstName &&
      profile?.lastName &&
      profile?.dateOfBirth &&
      profile?.bloodType &&
      profile?.gender
    );

    const hasAllergies = allergiesCount > 0;
    const hasMedications = medicationsCount > 0;
    const hasConditions = conditionsCount > 0;

    let points = 0;
    if (hasDemographics) points += 25;
    if (hasEmergencyContact) points += 25;
    if (hasAllergies) points += 20;
    if (hasMedications) points += 15;
    if (hasConditions) points += 15;

    return {
      demographics: hasDemographics,
      allergies: hasAllergies,
      medications: hasMedications,
      conditions: hasConditions,
      emergencyContact: hasEmergencyContact,
      overallPercentage: Math.min(100, points),
    };
  },
};
