import { createClient } from '@/lib/supabase/server'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits } from '@/lib/plan-tiers'
import { getOrgActivityInsights, type OrgActivityInsights } from '@/lib/event-insights'

export type MonthlyBucket = { month: string; value: number }

export type OrgVolunteerEngagement = {
  userId: string
  name: string
  totalHours: number
  lastActivityDate: string | null
  status: 'active' | 'at_risk' | 'churned'
  applications: number
}

export type OrgAnalytics = {
  organizationId: string
  organizationName: string
  planTier: string
  hourValuationUsd: number
  summary: {
    totalVerifiedHours: number
    totalImpactValueUsd: number
    openEvents: number
    totalApplications: number
    pendingApplications: number
    acceptedVolunteers: number
    completedPlacements: number
    pendingVerifications: number
    activeVolunteers: number
    atRiskVolunteers: number
    churnedVolunteers: number
    coordinatorSeatsUsed: number
    coordinatorSeatLimit: number
  }
  hoursByMonth: MonthlyBucket[]
  applicationsByMonth: MonthlyBucket[]
  topEvents: { title: string; applications: number; verifiedHours: number }[]
  volunteerEngagement: OrgVolunteerEngagement[]
  activity: OrgActivityInsights
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function lastNMonths(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

function bucketize(
  items: { date: string; value?: number }[],
  months: string[]
): MonthlyBucket[] {
  const map = new Map(months.map((m) => [m, 0]))
  for (const item of items) {
    const key = item.date.slice(0, 7)
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + (item.value ?? 1))
    }
  }
  return months.map((month) => ({ month, value: map.get(month) ?? 0 }))
}

function volunteerStatus(lastActivityDate: string | null): 'active' | 'at_risk' | 'churned' {
  if (!lastActivityDate) return 'churned'
  const days = Math.floor(
    (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days <= 30) return 'active'
  if (days <= 90) return 'at_risk'
  return 'churned'
}

export async function getOrgAnalytics(organizationId: string): Promise<OrgAnalytics | null> {
  const supabase = await createClient()
  const months = lastNMonths(12)

  const [{ data: org }, plan, activity] = await Promise.all([
    supabase.from('organizations').select('name, plan_tier').eq('id', organizationId).maybeSingle(),
    getOrgPlanContext(organizationId),
    getOrgActivityInsights(organizationId),
  ])

  if (!org || !plan) return null

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, status, volunteers_count')
    .eq('organization_id', organizationId)

  const oppIds = (opportunities ?? []).map((o) => o.id)
  if (oppIds.length === 0) {
    return {
      organizationId,
      organizationName: org.name,
      planTier: plan.planTier,
      hourValuationUsd: plan.hourValuationUsd,
      summary: {
        totalVerifiedHours: 0,
        totalImpactValueUsd: 0,
        openEvents: (opportunities ?? []).filter((o) => o.status === 'open').length,
        totalApplications: 0,
        pendingApplications: 0,
        acceptedVolunteers: 0,
        completedPlacements: 0,
        pendingVerifications: 0,
        activeVolunteers: 0,
        atRiskVolunteers: 0,
        churnedVolunteers: 0,
        coordinatorSeatsUsed: plan.coordinatorCount,
        coordinatorSeatLimit: plan.coordinatorSeatLimit,
      },
      hoursByMonth: months.map((month) => ({ month, value: 0 })),
      applicationsByMonth: months.map((month) => ({ month, value: 0 })),
      topEvents: [],
      volunteerEngagement: [],
      activity,
    }
  }

  const [{ data: hours }, { data: applications }] = await Promise.all([
    supabase
      .from('volunteer_hours')
      .select('hours, date, verified, user_id, opportunity_id, created_at')
      .in('opportunity_id', oppIds),
    supabase
      .from('applications')
      .select('id, status, user_id, opportunity_id, created_at, completed_at')
      .in('opportunity_id', oppIds),
  ])

  const verifiedHours = (hours ?? []).filter((h) => h.verified)
  const totalVerifiedHours = verifiedHours.reduce((s, h) => s + Number(h.hours), 0)
  const pendingVerifications = (hours ?? []).filter((h) => !h.verified).length

  const apps = applications ?? []
  const userIds = [
    ...new Set([
      ...verifiedHours.map((h) => h.user_id),
      ...apps.map((a) => a.user_id),
    ]),
  ].filter(Boolean) as string[]

  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Volunteer']))

  const volunteerEngagement: OrgVolunteerEngagement[] = userIds.map((userId) => {
    const userHours = verifiedHours.filter((h) => h.user_id === userId)
    const userApps = apps.filter((a) => a.user_id === userId)
    const dates: string[] = []
    userHours.forEach((h) => {
      dates.push(h.date)
      if (h.created_at) dates.push(h.created_at.slice(0, 10))
    })
    userApps.forEach((a) => {
      if (a.created_at) dates.push(a.created_at.slice(0, 10))
      if (a.completed_at) dates.push(a.completed_at.slice(0, 10))
    })
    const lastActivityDate = dates.length > 0 ? dates.sort().reverse()[0] : null
    return {
      userId,
      name: nameMap.get(userId) ?? 'Volunteer',
      totalHours: userHours.reduce((s, h) => s + Number(h.hours), 0),
      lastActivityDate,
      status: volunteerStatus(lastActivityDate),
      applications: userApps.length,
    }
  })

  volunteerEngagement.sort((a, b) => b.totalHours - a.totalHours)

  const hoursByMonth = bucketize(
    verifiedHours.map((h) => ({ date: h.date, value: Number(h.hours) })),
    months
  )
  const applicationsByMonth = bucketize(
    apps.map((a) => ({ date: (a.created_at ?? '').slice(0, 10), value: 1 })),
    months
  )

  const topEvents = (opportunities ?? []).map((opp) => ({
    title: opp.title,
    applications: apps.filter((a) => a.opportunity_id === opp.id).length,
    verifiedHours: verifiedHours
      .filter((h) => h.opportunity_id === opp.id)
      .reduce((s, h) => s + Number(h.hours), 0),
  }))
  topEvents.sort((a, b) => b.verifiedHours - a.verifiedHours)

  const activeVolunteers = volunteerEngagement.filter((v) => v.status === 'active').length
  const atRiskVolunteers = volunteerEngagement.filter((v) => v.status === 'at_risk').length
  const churnedVolunteers = volunteerEngagement.filter((v) => v.status === 'churned').length

  return {
    organizationId,
    organizationName: org.name,
    planTier: plan.planTier,
    hourValuationUsd: plan.hourValuationUsd,
    summary: {
      totalVerifiedHours,
      totalImpactValueUsd: totalVerifiedHours * plan.hourValuationUsd,
      openEvents: (opportunities ?? []).filter((o) => o.status === 'open').length,
      totalApplications: apps.length,
      pendingApplications: apps.filter((a) => a.status === 'pending').length,
      acceptedVolunteers: apps.filter((a) => a.status === 'accepted' || a.status === 'completed').length,
      completedPlacements: apps.filter((a) => a.status === 'completed').length,
      pendingVerifications,
      activeVolunteers,
      atRiskVolunteers,
      churnedVolunteers,
      coordinatorSeatsUsed: plan.coordinatorCount,
      coordinatorSeatLimit: plan.coordinatorSeatLimit,
    },
    hoursByMonth,
    applicationsByMonth,
    topEvents: topEvents.slice(0, 6),
    volunteerEngagement: volunteerEngagement.slice(0, 20),
    activity,
  }
}

export type MultiOrgRollup = {
  organizations: { id: string; name: string; planTier: string; verifiedHours: number; impactValueUsd: number }[]
  totals: {
    verifiedHours: number
    impactValueUsd: number
    activeVolunteers: number
    atRiskVolunteers: number
    churnedVolunteers: number
  }
}

export async function getMultiOrgRollup(userId: string): Promise<MultiOrgRollup | null> {
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name, plan_tier)')
    .eq('user_id', userId)
    .in('role', ['owner', 'coordinator'])

  const orgs = (memberships ?? [])
    .map((m) => m.organizations as unknown as { id: string; name: string; plan_tier: string | null } | null)
    .filter(Boolean) as { id: string; name: string; plan_tier: string | null }[]

  if (orgs.length === 0) return null

  const hasEnterprise = orgs.some((o) => planLimits(o.plan_tier).multiOrgRollup)
  if (!hasEnterprise && orgs.length > 1) {
    // Growth users see rollup of owned orgs only if any org is enterprise; otherwise still show combined for 2+ orgs on analytics page with note
  }

  const analytics = await Promise.all(orgs.map((o) => getOrgAnalytics(o.id)))
  const valid = analytics.filter(Boolean) as OrgAnalytics[]

  const organizations = valid.map((a) => ({
    id: a.organizationId,
    name: a.organizationName,
    planTier: a.planTier,
    verifiedHours: a.summary.totalVerifiedHours,
    impactValueUsd: a.summary.totalImpactValueUsd,
  }))

  return {
    organizations,
    totals: {
      verifiedHours: organizations.reduce((s, o) => s + o.verifiedHours, 0),
      impactValueUsd: organizations.reduce((s, o) => s + o.impactValueUsd, 0),
      activeVolunteers: valid.reduce((s, a) => s + a.summary.activeVolunteers, 0),
      atRiskVolunteers: valid.reduce((s, a) => s + a.summary.atRiskVolunteers, 0),
      churnedVolunteers: valid.reduce((s, a) => s + a.summary.churnedVolunteers, 0),
    },
  }
}
