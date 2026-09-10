import { SHARE_CATEGORIES, type ShareCategory } from '../../../types/pass';

export const CATEGORY_LABELS: Record<ShareCategory, string> = {
  DEMOGRAPHICS: 'Demographics',
  ALLERGIES: 'Allergies',
  MEDICATIONS: 'Medications',
  CONDITIONS: 'Conditions',
  EMERGENCY_CONTACT: 'Emergency contact',
};

export const CATEGORY_DESCRIPTIONS: Record<ShareCategory, string> = {
  DEMOGRAPHICS: 'Name, date of birth, gender, phone',
  ALLERGIES: 'Substances and known reactions',
  MEDICATIONS: 'Current medications and dosages',
  CONDITIONS: 'Diagnosed conditions',
  EMERGENCY_CONTACT: 'Who to call in an emergency',
};

export const ALL_CATEGORIES: readonly ShareCategory[] = SHARE_CATEGORIES;

export function formatCategoryList(categories: ShareCategory[]): string {
  if (categories.length === 0) return 'No categories selected';
  return categories.map((category) => CATEGORY_LABELS[category]).join(', ');
}
