import { EXPIRY_OPTIONS, expiresAtFromHours, isExpired } from '../utils/expiry';

describe('expiry utils', () => {
  it('converts an hours-from-now choice into a future ISO instant', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const result = expiresAtFromHours(4, now);
    expect(result).toBe('2026-01-01T04:00:00.000Z');
  });

  it('offers the documented preset durations', () => {
    expect(EXPIRY_OPTIONS.map((o) => o.hours)).toEqual([1, 4, 24, 168]);
  });

  it('treats a past instant as expired and a future one as not expired', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    expect(isExpired('2025-12-31T23:59:59.000Z', now)).toBe(true);
    expect(isExpired('2026-01-02T00:00:00.000Z', now)).toBe(false);
  });
});
