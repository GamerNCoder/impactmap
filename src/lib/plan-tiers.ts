import { HOUR_VALUATION_USD } from '@/lib/impact-passport'

export const PLAN_TIERS = ['starter', 'growth', 'enterprise'] as const
export type PlanTier = (typeof PLAN_TIERS)[number]

export type PlanLimits = {
  maxOwnedOrgs: number
  maxCoordinatorSeats: number
  customValuation: boolean
  verifiedBadge: boolean
  esgExport: boolean
  apiAccess: boolean
  webhooks: boolean
  multiOrgRollup: boolean
  sso: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    maxOwnedOrgs: 1,
    maxCoordinatorSeats: 1,
    customValuation: false,
    verifiedBadge: false,
    esgExport: false,
    apiAccess: false,
    webhooks: false,
    multiOrgRollup: false,
    sso: false,
  },
  growth: {
    maxOwnedOrgs: 3,
    maxCoordinatorSeats: 10,
    customValuation: true,
    verifiedBadge: true,
    esgExport: false,
    apiAccess: false,
    webhooks: false,
    multiOrgRollup: false,
    sso: false,
  },
  enterprise: {
    maxOwnedOrgs: 999,
    maxCoordinatorSeats: 999,
    customValuation: true,
    verifiedBadge: true,
    esgExport: true,
    apiAccess: true,
    webhooks: true,
    multiOrgRollup: true,
    sso: true,
  },
}

export function normalizePlanTier(tier: string | null | undefined): PlanTier {
  if (tier === 'growth' || tier === 'enterprise') return tier
  return 'starter'
}

export function planLimits(tier: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[normalizePlanTier(tier)]
}

export function planLabel(tier: PlanTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1)
}

export function orgHourValuation(
  planTier: string | null | undefined,
  customRate: number | null | undefined
): number {
  const limits = planLimits(planTier)
  if (limits.customValuation && customRate != null && customRate > 0) {
    return customRate
  }
  return HOUR_VALUATION_USD
}

export function formatPlanFeatureList(tier: PlanTier): string[] {
  const l = PLAN_LIMITS[tier]
  const features: string[] = [
    `${l.maxOwnedOrgs === 999 ? 'Unlimited' : l.maxOwnedOrgs} organization profile${l.maxOwnedOrgs === 1 ? '' : 's'}`,
    `${l.maxCoordinatorSeats === 999 ? 'Unlimited' : l.maxCoordinatorSeats} coordinator seat${l.maxCoordinatorSeats === 1 ? '' : 's'}`,
  ]
  if (l.verifiedBadge) features.push('Verified organization badge')
  if (l.customValuation) features.push('Custom impact valuation')
  if (l.esgExport) features.push('ESG / CSR export mapping')
  if (l.apiAccess) features.push('API access')
  if (l.webhooks) features.push('Webhooks')
  if (l.multiOrgRollup) features.push('Multi-org rollup dashboard')
  if (l.sso) features.push('SAML / SSO')
  return features
}
