export interface ExpiryOption {
  label: string;
  hours: number;
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: '24 hours', hours: 24 },
  { label: '7 days', hours: 24 * 7 },
];

/** Turns an hours-from-now choice into the ISO instant the backend expects. */
export function expiresAtFromHours(hours: number, now: Date = new Date()): string {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function formatExpiresAt(expiresAt: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function isExpired(expiresAt: string, now: Date = new Date()): boolean {
  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime()) ? false : date.getTime() <= now.getTime();
}
