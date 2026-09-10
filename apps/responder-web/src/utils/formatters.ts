export function formatAge(birthDate: string | null): string | null {
  if (!birthDate) return null
  const dob = new Date(birthDate)
  if (Number.isNaN(dob.getTime())) return null

  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate())
  if (!hasHadBirthdayThisYear) age -= 1

  return age >= 0 ? `${age} yrs` : null
}

export function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return 'Unknown expiry'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
