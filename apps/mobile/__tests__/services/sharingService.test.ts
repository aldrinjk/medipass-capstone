import { sharingService } from '../../services/sharingService';
import { ALL_SHARE_CATEGORIES, ShareCategory } from '../../types/sharing';

describe('sharingService Integration', () => {
  it('fetches default sharing preferences', async () => {
    const prefs = await sharingService.getSharingPreferences();
    expect(prefs.categories).toBeDefined();
    expect(Array.isArray(prefs.categories)).toBe(true);
  });

  it('updates sharing preferences categories correctly', async () => {
    const selected: ShareCategory[] = ['DEMOGRAPHICS', 'ALLERGIES', 'EMERGENCY_CONTACT'];
    const updated = await sharingService.updateSharingPreferences(selected);

    expect(updated.categories).toEqual(selected);
    expect(updated.categories).not.toContain('MEDICATIONS');
    expect(updated.categories).not.toContain('CONDITIONS');
  });

  it('supports selecting all share categories', async () => {
    const updated = await sharingService.updateSharingPreferences(ALL_SHARE_CATEGORIES);
    expect(updated.categories.length).toBe(5);
    expect(updated.categories).toContain('DEMOGRAPHICS');
    expect(updated.categories).toContain('ALLERGIES');
    expect(updated.categories).toContain('MEDICATIONS');
    expect(updated.categories).toContain('CONDITIONS');
    expect(updated.categories).toContain('EMERGENCY_CONTACT');
  });
});
