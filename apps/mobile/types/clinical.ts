export interface Allergy {
  id: string;
  substance: string;
  reaction?: string;
  severity?: string;
}

export interface AllergyInput {
  substance: string;
  reaction?: string;
  severity?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface MedicationInput {
  name: string;
  dosage?: string;
  frequency?: string;
}

export interface Condition {
  id: string;
  name: string;
  status?: string;
  notes?: string;
}

export interface ConditionInput {
  name: string;
  status?: string;
  notes?: string;
}
