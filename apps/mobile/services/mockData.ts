import {
  PatientProfile,
  Allergy,
  Medication,
  Condition,
  EmergencyContact,
  SharingPreferences,
  PassMetadata,
  AccessLogResponse,
} from '../types';

export const MOCK_PATIENT_PROFILE: PatientProfile = {
  id: 'pat-syn-90210',
  fullName: 'Jane Doe',
  birthDate: '1988-04-12',
  gender: 'FEMALE',
  phone: '+1 (555) 234-5678',
};

export const MOCK_ALLERGIES: Allergy[] = [
  {
    id: 'all-001',
    substance: 'Penicillin',
    severity: 'SEVERE',
    reaction: 'Anaphylaxis, severe hives, facial edema',
  },
  {
    id: 'all-002',
    substance: 'Peanuts',
    severity: 'MODERATE',
    reaction: 'Bronchospasm, rash, gastrointestinal distress',
  },
  {
    id: 'all-003',
    substance: 'Latex',
    severity: 'MILD',
    reaction: 'Contact dermatitis, localized itching',
  },
];

export const MOCK_MEDICATIONS: Medication[] = [
  {
    id: 'med-001',
    name: 'Albuterol Sulfate Inhaler',
    dosage: '90 mcg/actuation',
    frequency: '2 puffs every 4-6 hours as needed',
  },
  {
    id: 'med-002',
    name: 'Lisinopril',
    dosage: '10 mg',
    frequency: 'Once daily in the morning',
  },
  {
    id: 'med-003',
    name: 'EpiPen Auto-Injector',
    dosage: '0.3 mg',
    frequency: 'As needed for severe allergic reaction',
  },
];

export const MOCK_CONDITIONS: Condition[] = [
  {
    id: 'con-001',
    name: 'Chronic Moderate Asthma',
    status: 'ACTIVE',
    notes: 'Triggered by cold air and respiratory infections.',
  },
  {
    id: 'con-002',
    name: 'Primary Essential Hypertension',
    status: 'ACTIVE',
    notes: 'Well managed on ACE inhibitor therapy.',
  },
];

export const MOCK_EMERGENCY_CONTACT: EmergencyContact = {
  name: 'Marcus Doe',
  relationship: 'Spouse',
  phone: '+1 (555) 987-6543',
};

export const MOCK_SHARING_PREFERENCES: SharingPreferences = {
  categories: ['DEMOGRAPHICS', 'ALLERGIES', 'MEDICATIONS', 'CONDITIONS', 'EMERGENCY_CONTACT'],
};

export const MOCK_PASSES: PassMetadata[] = [
  {
    passId: 'pass-a89c-4f12',
    status: 'ACTIVE',
        createdAt: '2026-09-08T10:00:00Z',
        expiresAt: '2026-09-10T10:00:00Z',
        categories: ['DEMOGRAPHICS', 'ALLERGIES', 'MEDICATIONS', 'EMERGENCY_CONTACT'],
  },
  {
    passId: 'pass-b12e-9941',
    status: 'EXPIRED',
    createdAt: '2026-09-01T08:00:00Z',
    expiresAt: '2026-09-03T08:00:00Z',
    categories: ['DEMOGRAPHICS', 'ALLERGIES'],
  },
];

export const MOCK_AUDIT_LOGS: Record<string, AccessLogResponse[]> = {
  'pass-a89c-4f12': [
    {
      id: 'aud-001',
      passId: 'pass-a89c-4f12',
      accessedAt: '2026-09-08T12:45:10Z',
      outcome: 'SUCCESS',
    },
    {
      id: 'aud-002',
      passId: 'pass-a89c-4f12',
      accessedAt: '2026-09-08T14:10:22Z',
      outcome: 'SUCCESS',
    },
  ],
};
