import { createClient } from '@/lib/supabase/server'
import { getUserCommitmentScore } from '@/lib/commitment-data'
import { getPassedSkills } from '@/lib/competency-data'
import { getVolunteerMatches } from '@/lib/matching-data'
import { getVolunteerActivityInsights, type VolunteerActivityInsights } from '@/lib/event-insights'
import { HOUR_VALUATION_USD, summarizePassport } from '@/lib/impact-passport'

export type MonthlyBucket = { month: string; value: number }

export type VolunteerAnalytics = {
  summary: {
    verifiedHours: number
    pendingHours: number
    impactValueUsd: number
    applicationsTotal: number
    applicationsAccepted: number
    applicationsCompleted: number
    applicationsRejected: number
    commitmentScore: number
    commitmentLabel: string
    verifiedSkills: number
    profileSkills: number
    avgMatchScore: number
    credentialsCount: number
    daysSinceLastActivity: number | null
    engagementStatus: 'active' | 'at_risk' | 'churned' | 'new'
  }
  hoursByMonth: MonthlyBucket[]
  applicationsByMonth: MonthlyBucket[]
  recentActivity: { date: string; label: string; type: string }[]
  activity: VolunteerActivityInsights
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

function engagementStatus(
  daysSince: number | null,
  totalApps: number
): VolunteerAnalytics['summary']['engagementStatus'] {
  if (totalApps === 0) return 'new'
  if (daysSince === null) return 'new'
  if (daysSince <= 30) return 'active'
  if (daysSince <= 90) return 'at_risk'
  return 'churned'
}

export async function getVolunteerAnalytics(userId: string): Promise<VolunteerAnalytics> {
  const supabase = await createClient()
  const months = lastNMonths(12)

  const [
    { data: profile },
    { data: hours },
    { data: applications },
    commitment,
    verifiedSkills,
    { ranked },
    activity,
  ] = await Promise.all([
    supabase.from('profiles').select('skills').eq('id', userId).maybeSingle(),
    supabase
      .from('volunteer_hours')
      .select('hours, date, verified, created_at, opportunities(title)')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    supabase
      .from('applications')
      .select('status, created_at, completed_at, opportunities(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    getUserCommitmentScore(userId),
    getPassedSkills(userId),
    getVolunteerMatches(userId),
    getVolunteerActivityInsights(userId),
  ])

  const verified = (hours ?? []).filter((h) => h.verified)
  const pending = (hours ?? []).filter((h) => !h.verified)
  const passport = summarizePassport(verified, pending)

  const apps = applications ?? []
  const avgMatch =
    ranked.length > 0
      ? Math.round(ranked.reduce((s, r) => s + r.match.score, 0) / ranked.length)
      : 0

  const activityDates: Date[] = []
  for (const h of hours ?? []) {
    activityDates.push(new Date(h.date))
    if (h.created_at) activityDates.push(new Date(h.created_at))
  }
  for (const a of apps) {
    if (a.created_at) activityDates.push(new Date(a.created_at))
    if (a.completed_at) activityDates.push(new Date(a.completed_at))
  }

  const lastActivity =
    activityDates.length > 0
      ? new Date(Math.max(...activityDates.map((d) => d.getTime())))
      : null
  const daysSinceLastActivity = lastActivity
    ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const verifiedCompletions = apps.filter(
    (a) => a.status === 'completed'
  ).length

  const hoursByMonth = bucketize(
    verified.map((h) => ({ date: h.date, value: Number(h.hours) })),
    months
  )

  const applicationsByMonth = bucketize(
    apps.map((a) => ({ date: (a.created_at ?? '').slice(0, 10), value: 1 })),
    months
  )

  const recentActivity: VolunteerAnalytics['recentActivity'] = []
  for (const h of (hours ?? []).slice(0, 5)) {
    const opp = h.opportunities as unknown as { title: string } | null
    recentActivity.push({
      date: h.date,
      label: `${h.verified ? 'Verified' : 'Logged'} ${h.hours}h — ${opp?.title ?? 'Event'}`,
      type: h.verified ? 'verified_hours' : 'hours',
    })
  }
  for (const a of apps.slice(0, 5)) {
    const opp = a.opportunities as unknown as { title: string } | null
    recentActivity.push({
      date: (a.created_at ?? '').slice(0, 10),
      label: `Application ${a.status} — ${opp?.title ?? 'Event'}`,
      type: 'application',
    })
  }
  recentActivity.sort((a, b) => b.date.localeCompare(a.date))

  return {
    summary: {
      verifiedHours: passport.totalVerifiedHours,
      pendingHours: passport.totalPendingHours,
      impactValueUsd: passport.totalVerifiedHours * HOUR_VALUATION_USD,
      applicationsTotal: apps.length,
      applicationsAccepted: apps.filter((a) => a.status === 'accepted' || a.status === 'completed').length,
      applicationsCompleted: verifiedCompletions,
      applicationsRejected: apps.filter((a) => a.status === 'rejected').length,
      commitmentScore: commitment.score,
      commitmentLabel: commitment.label,
      verifiedSkills: verifiedSkills.length,
      profileSkills: (profile?.skills as string[] | null)?.length ?? 0,
      avgMatchScore: avgMatch,
      credentialsCount: passport.credentialCount + verifiedCompletions,
      daysSinceLastActivity,
      engagementStatus: engagementStatus(daysSinceLastActivity, apps.length),
    },
    hoursByMonth,
    applicationsByMonth,
    recentActivity: recentActivity.slice(0, 8),
    activity,
  }
}
