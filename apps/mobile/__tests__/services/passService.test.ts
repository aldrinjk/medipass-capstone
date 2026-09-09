import { passService } from '../../services/passService';
import { ShareCategory } from '../../types/sharing';

describe('passService Integration', () => {
  it('lists existing patient emergency passes', async () => {
    const passes = await passService.getPasses();
    expect(Array.isArray(passes)).toBe(true);
    expect(passes.length).toBeGreaterThan(0);
  });

  it('generates a new emergency pass with expiration and permitted categories', async () => {
    const categories: ShareCategory[] = ['DEMOGRAPHICS', 'ALLERGIES'];
    const newPass = await passService.createPass(categories, 24);

    expect(newPass.passId).toBeTruthy();
    expect(newPass.status).toBe('ACTIVE');
    expect(newPass.categories).toEqual(categories);
    expect(newPass.publicUrl).toContain(newPass.passId);
    expect(new Date(newPass.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('revokes an active pass', async () => {
    const categories: ShareCategory[] = ['DEMOGRAPHICS'];
    const pass = await passService.createPass(categories, 12);
    expect(pass.status).toBe('ACTIVE');

    const revoked = await passService.revokePass(pass.passId);
    expect(revoked.status).toBe('REVOKED');
  });

  it('retrieves access audit logs for an active pass', async () => {
    const passes = await passService.getPasses();
    const activePass = passes.find((p) => p.status === 'ACTIVE');
    if (activePass) {
      const logs = await passService.getPassAuditLogs(activePass.passId);
      expect(Array.isArray(logs)).toBe(true);
      if (logs.length > 0) {
        expect(logs[0].accessStatus).toBeDefined();
        expect(logs[0].timestamp).toBeDefined();
      }
    }
  });
});
