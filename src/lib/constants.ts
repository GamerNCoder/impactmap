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

export function formatDate(date: string | null | undefined): string {
  if (!date) return 'Flexible'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
