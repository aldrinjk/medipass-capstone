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
    description: 'Basic patient information including full name, birth date, gender, and phone number.',
  },
  ALLERGIES: {
    label: 'Allergies',
    description: 'Documented allergies, reaction symptoms, and severity ratings.',
  },
  MEDICATIONS: {
    label: 'Medications',
    description: 'Current medications, dosage, and frequency.',
  },
  CONDITIONS: {
    label: 'Conditions',
    description: 'Documented medical conditions, status, and notes.',
  },
  EMERGENCY_CONTACT: {
    label: 'Emergency Contact',
    description: 'Primary emergency contact name, relationship, and phone number.',
  },
};
