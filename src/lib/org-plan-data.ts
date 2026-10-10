import { createClient } from '@/lib/supabase/server'
import { orgHourValuation, planLimits, type PlanTier, normalizePlanTier } from '@/lib/plan-tiers'

export type OrgPlanContext = {
  organizationId: string
  planTier: PlanTier
  hourValuationUsd: number
  coordinatorCount: number
  coordinatorSeatLimit: number
  canAddCoordinator: boolean
  verified: boolean
}

export async function getOrgPlanContext(organizationId: string): Promise<OrgPlanContext | null> {
  const supabase = await createClient()

  const [{ data: org }, { count }] = await Promise.all([
    supabase
      .from('organizations')
      .select('plan_tier, hour_valuation_usd, verified')
      .eq('id', organizationId)
      .maybeSingle(),
    supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'coordinator']),
  ])

  if (!org) return null

  const planTier = normalizePlanTier(org.plan_tier)
  const limits = planLimits(planTier)
  const coordinatorCount = count ?? 0

  return {
    organizationId,
    planTier,
    hourValuationUsd: orgHourValuation(planTier, org.hour_valuation_usd),
    coordinatorCount,
    coordinatorSeatLimit: limits.maxCoordinatorSeats,
    canAddCoordinator: coordinatorCount < limits.maxCoordinatorSeats,
    verified: org.verified === true,
  }
}

export async function countOwnedOrganizations(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('role', 'owner')

  return count ?? 0
}

export async function getUserManagedOrganizations(userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name, plan_tier, verified)')
    .eq('user_id', userId)
    .in('role', ['owner', 'coordinator'])

  return (data ?? []).map((row) => {
    const org = row.organizations as unknown as {
      id: string
      name: string
      plan_tier: string | null
      verified: boolean | null
    } | null
    return org
      ? {
          id: org.id,
          name: org.name,
          planTier: normalizePlanTier(org.plan_tier),
          verified: org.verified === true,
          role: row.role as string,
        }
      : null
  }).filter(Boolean) as {
    id: string
    name: string
    planTier: PlanTier
    verified: boolean
    role: string
  }[]
}
