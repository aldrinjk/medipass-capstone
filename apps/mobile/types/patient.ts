export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';

export interface PatientProfile {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodType?: BloodType;
  phone?: string;
  address?: string;
  completenessScore?: number;
}

export interface UpdatePatientProfileRequest {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodType?: BloodType;
  phone?: string;
  address?: string;
}

export interface CategoryCompleteness {
  demographics: boolean;
  allergies: boolean;
  medications: boolean;
  conditions: boolean;
  emergencyContact: boolean;
  overallPercentage: number;
}
