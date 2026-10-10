/** Independent Sector 2025 volunteer hour valuation (USD) */
export const HOUR_VALUATION_USD = 33.49

export function formatImpactValue(hours: number): string {
  const value = hours * HOUR_VALUATION_USD
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function generateVerificationCode(): string {
  const segment = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return `IMP-${segment}`
}

export type PassportCredential = {
  id: string
  verificationCode: string
  hours: number
  date: string
  description: string | null
  verifiedAt: string
  supervisorName: string | null
  opportunityTitle: string
  organizationName: string
  category: string
}

export type PassportSummary = {
  totalVerifiedHours: number
  totalPendingHours: number
  totalImpactValue: number
  credentialCount: number
}

export function summarizePassport(
  verified: { hours: number }[],
  pending: { hours: number }[]
): PassportSummary {
  const totalVerifiedHours = verified.reduce((s, h) => s + Number(h.hours), 0)
  const totalPendingHours = pending.reduce((s, h) => s + Number(h.hours), 0)
  return {
    totalVerifiedHours,
    totalPendingHours,
    totalImpactValue: totalVerifiedHours * HOUR_VALUATION_USD,
    credentialCount: verified.length,
  }
}
