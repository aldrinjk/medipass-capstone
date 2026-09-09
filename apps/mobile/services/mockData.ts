import {
  PatientProfile,
  Allergy,
  Medication,
  Condition,
  EmergencyContact,
  SharingPreferences,
  PassSummary,
  PassAuditLog,
} from '../types';

export const MOCK_PATIENT_PROFILE: PatientProfile = {
  id: 'pat-syn-90210',
  firstName: 'Jane',
  lastName: 'Doe',
  dateOfBirth: '1988-04-12',
  gender: 'FEMALE',
  bloodType: 'O+',
  phone: '+1 (555) 234-5678',
  address: '742 Evergreen Terrace, Springfield, IL',
  completenessScore: 85,
};

export const MOCK_ALLERGIES: Allergy[] = [
  {
    id: 'all-001',
    substance: 'Penicillin',
    severity: 'SEVERE',
    reaction: 'Anaphylaxis, severe hives, facial edema',
    status: 'ACTIVE',
    recordedDate: '2024-01-15T09:30:00Z',
  },
  {
    id: 'all-002',
    substance: 'Peanuts',
    severity: 'MODERATE',
    reaction: 'Bronchospasm, rash, gastrointestinal distress',
    status: 'ACTIVE',
    recordedDate: '2023-08-20T14:15:00Z',
  },
  {
    id: 'all-003',
    substance: 'Latex',
    severity: 'MILD',
    reaction: 'Contact dermatitis, localized itching',
    status: 'RESOLVED',
    recordedDate: '2022-05-10T11:00:00Z',
  },
];

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'med-001',
    name: 'Albuterol Sulfate Inhaler',
    dosage: '90 mcg/actuation',
    frequency: '2 puffs every 4-6 hours as needed',
    route: 'Inhalation',
    instructions: 'Use spacer if available. Seek ER if no relief after 6 puffs.',
    status: 'ACTIVE',
  },
  {
    id: 'med-002',
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily in the morning',
    route: 'Oral',
    instructions: 'Take with full glass of water. Monitor blood pressure.',
    status: 'ACTIVE',
  },
  {
    id: 'med-003',
    name: 'EpiPen Auto-Injector',
    dosage: '0.3 mg',
    frequency: 'As needed for severe allergic reaction',
    route: 'Intramuscular',
    instructions: 'Inject into outer thigh and hold for 3 seconds. Call 911 immediately.',
    status: 'ACTIVE',
  },
];

export const MOCK_CONDITIONS: Condition[] = [
  {
    id: 'con-001',
    conditionName: 'Chronic Moderate Asthma',
    clinicalStatus: 'ACTIVE',
    onsetDate: '2015-06-01',
    notes: 'Triggered by cold air and respiratory infections.',
  },
  {
    id: 'con-002',
    conditionName: 'Primary Essential Hypertension',
    clinicalStatus: 'ACTIVE',
    onsetDate: '2021-11-10',
    notes: 'Well managed on ACE inhibitor therapy.',
  },
];

export const MOCK_EMERGENCY_CONTACT: EmergencyContact = {
  id: 'ec-001',
  name: 'Marcus Doe',
  relationship: 'Spouse',
  phoneNumber: '+1 (555) 987-6543',
  alternatePhone: '+1 (555) 345-6789',
  email: 'marcus.doe@example.org',
};

export const MOCK_SHARING_PREFERENCES: SharingPreferences = {
  categories: ['DEMOGRAPHICS', 'ALLERGIES', 'MEDICATIONS', 'CONDITIONS', 'EMERGENCY_CONTACT'],
};

export const MOCK_PASSES: PassSummary[] = [
  {
    passId: 'pass-a89c-4f12',
    status: 'ACTIVE',
    createdAt: '2026-09-08T10:00:00Z',
    expiresAt: '2026-09-10T10:00:00Z',
    publicUrl: 'https://medipass.health/p/pass-a89c-4f12-token-active',
    categories: ['DEMOGRAPHICS', 'ALLERGIES', 'MEDICATIONS', 'EMERGENCY_CONTACT'],
  },
  {
    passId: 'pass-b12e-9941',
    status: 'EXPIRED',
    createdAt: '2026-09-01T08:00:00Z',
    expiresAt: '2026-09-03T08:00:00Z',
    publicUrl: 'https://medipass.health/p/pass-b12e-9941-token-expired',
    categories: ['DEMOGRAPHICS', 'ALLERGIES'],
  },
];

export const MOCK_AUDIT_LOGS: Record<string, PassAuditLog[]> = {
  'pass-a89c-4f12': [
    {
      id: 'aud-001',
      passId: 'pass-a89c-4f12',
      timestamp: '2026-09-08T12:45:10Z',
      accessStatus: 'SUCCESS',
      ipAddressTruncated: '192.168.1.xxx',
      userAgent: 'Mobile Safari / iOS 19',
    },
    {
      id: 'aud-002',
      passId: 'pass-a89c-4f12',
      timestamp: '2026-09-08T14:10:22Z',
      accessStatus: 'SUCCESS',
      ipAddressTruncated: '10.0.0.xxx',
      userAgent: 'Chrome Mobile / Android 16',
    },
  ],
};
