export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE';
export type AllergyStatus = 'ACTIVE' | 'INACTIVE' | 'RESOLVED';

export interface Allergy {
  id: string;
  substance: string;
  severity: AllergySeverity;
  reaction?: string;
  status: AllergyStatus;
  recordedDate?: string;
}

export interface AllergyInput {
  substance: string;
  severity: AllergySeverity;
  reaction?: string;
  status?: AllergyStatus;
}

export type MedicationStatus = 'ACTIVE' | 'COMPLETED' | 'DISCONTINUED';

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  instructions?: string;
  status: MedicationStatus;
}

export interface MedicationInput {
  name: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  instructions?: string;
  status?: MedicationStatus;
}

export type ConditionClinicalStatus =
  | 'ACTIVE'
  | 'RECURRENCE'
  | 'RELAPSE'
  | 'INACTIVE'
  | 'REMISSION'
  | 'RESOLVED';

export interface Condition {
  id: string;
  conditionName: string;
  clinicalStatus: ConditionClinicalStatus;
  onsetDate?: string;
  notes?: string;
}

export interface ConditionInput {
  conditionName: string;
  clinicalStatus: ConditionClinicalStatus;
  onsetDate?: string;
  notes?: string;
}
