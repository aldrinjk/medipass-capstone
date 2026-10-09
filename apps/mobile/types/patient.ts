export interface PatientProfile {
  id: string;
  fullName: string;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
}

export interface UpdatePatientProfileRequest {
  fullName: string;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
}

export interface CategoryCompleteness {
  demographics: boolean;
  allergies: boolean;
  medications: boolean;
  conditions: boolean;
  emergencyContact: boolean;
  overallPercentage: number;
}
