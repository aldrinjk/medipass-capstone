import { ALL_CATEGORIES, formatCategoryList } from '../utils/categories';

describe('categories utils', () => {
  it('lists all five frozen ShareCategory values', () => {
    expect(ALL_CATEGORIES).toEqual([
      'DEMOGRAPHICS',
      'ALLERGIES',
      'MEDICATIONS',
      'CONDITIONS',
      'EMERGENCY_CONTACT',
    ]);
  });

  it('formats a human-readable, comma-joined category list', () => {
    expect(formatCategoryList(['ALLERGIES', 'MEDICATIONS'])).toBe('Allergies, Medications');
  });

  it('has a distinct message for an empty selection', () => {
    expect(formatCategoryList([])).toBe('No categories selected');
  });
});
