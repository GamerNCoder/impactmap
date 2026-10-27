export const OPPORTUNITY_CATEGORIES = [
  'Education',
  'Environment',
  'Food Security',
  'Health',
  'Community',
  'Animal Welfare',
  'Arts & Culture',
  'Disaster Relief',
] as const

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number]

export const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'completed'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export function formatDate(date: string | null | undefined, locale: string = 'en'): string {
  if (!date) return 'Flexible'
  // Date-only values (YYYY-MM-DD) are calendar days: format them in UTC so they don't shift a day west of UTC.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(date)
  return new Date(dateOnly ? `${date}T00:00:00Z` : date).toLocaleDateString(locale === 'es' ? 'es-US' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  })
}

export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function statusColor(status: string): string {
  switch (status) {
    case 'accepted':
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}
