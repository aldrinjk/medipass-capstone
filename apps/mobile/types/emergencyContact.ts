export interface EmergencyContact {
  id?: string;
  name: string;
  relationship: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
}

export interface EmergencyContactInput {
  name: string;
  relationship: string;
  phoneNumber: string;
  alternatePhone?: string;
  email?: string;
}
