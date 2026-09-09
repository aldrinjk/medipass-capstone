export type ShareCategory =
  | 'DEMOGRAPHICS'
  | 'ALLERGIES'
  | 'MEDICATIONS'
  | 'CONDITIONS'
  | 'EMERGENCY_CONTACT';

export const ALL_SHARE_CATEGORIES: ShareCategory[] = [
  'DEMOGRAPHICS',
  'ALLERGIES',
  'MEDICATIONS',
  'CONDITIONS',
  'EMERGENCY_CONTACT',
];

export interface SharingPreferences {
  categories: ShareCategory[];
}

export const SHARE_CATEGORY_LABELS: Record<ShareCategory, { label: string; description: string }> = {
  DEMOGRAPHICS: {
    label: 'Demographics',
    description: 'Basic patient information such as full name, date of birth, gender, and blood type.',
  },
  ALLERGIES: {
    label: 'Allergies',
    description: 'Documented allergies, reaction symptoms, and severity ratings.',
  },
  MEDICATIONS: {
    label: 'Medications',
    description: 'Current and critical medications, dosages, frequencies, and administration instructions.',
  },
  CONDITIONS: {
    label: 'Conditions',
    description: 'Active medical conditions, chronic diagnoses, and onset timeline.',
  },
  EMERGENCY_CONTACT: {
    label: 'Emergency Contact',
    description: 'Primary emergency contact name, relationship, and reachable phone number.',
  },
};
