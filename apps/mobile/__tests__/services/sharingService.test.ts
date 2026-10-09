import { SHARE_CATEGORY_LABELS } from '../../types/sharing';

describe('sharingService Integration', () => {
  it('describes only backend-supported category fields', () => {
    const allCopy = Object.values(SHARE_CATEGORY_LABELS)
      .map((item) => `${item.label} ${item.description}`)
      .join(' ')
      .toLowerCase();

    expect(allCopy).not.toContain('blood type');
    expect(allCopy).not.toContain('instructions');
    expect(allCopy).not.toContain('onset');
    expect(SHARE_CATEGORY_LABELS.DEMOGRAPHICS.description).toContain('full name');
    expect(SHARE_CATEGORY_LABELS.MEDICATIONS.description).toContain('frequency');
    expect(SHARE_CATEGORY_LABELS.CONDITIONS.description).toContain('notes');
  });
});
