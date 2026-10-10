import { createClient } from '@/lib/supabase/server'
import { APP_EVENTS } from '@/lib/app-events'

export type VolunteerActivityInsights = {
  hubVisits30d: number
  analyticsViews30d: number
  matchPageViews30d: number
  opportunityViews30d: number
  aiAssistCount30d: number
  competencyTests30d: number
  messagesSent30d: number
  passportViews30d: number
  topPages30d: { path: string; count: number }[]
}

export type OrgActivityInsights = {
  dashboardViews30d: number
  analyticsViews30d: number
  exports30d: number
  coordinatorActions30d: number
  applicationsReceived30d: number
  publicPassportViews30d: number
  apiCalls30d: number
}

function since30d(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString()
}

function countEvents(events: { event_name: string }[], name: string): number {
  return events.filter((e) => e.event_name === name).length
}

export async function getVolunteerActivityInsights(
  userId: string
): Promise<VolunteerActivityInsights> {
  const supabase = await createClient()
  const since = since30d()

  const { data: events } = await supabase
    .from('app_events')
    .select('event_name, path')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(2000)

  const rows = events ?? []
  const pageCounts = new Map<string, number>()
  for (const row of rows) {
    if (row.event_name === APP_EVENTS.PAGE_VIEW && row.path) {
      pageCounts.set(row.path, (pageCounts.get(row.path) ?? 0) + 1)
    }
  }

  const topPages30d = [...pageCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const pageViews = (prefix: string) =>
    rows.filter((r) => r.event_name === APP_EVENTS.PAGE_VIEW && r.path?.startsWith(prefix)).length

  return {
    hubVisits30d: pageViews('/dashboard'),
    analyticsViews30d: pageViews('/dashboard/analytics'),
    matchPageViews30d:
      countEvents(rows, APP_EVENTS.MATCHES_VIEW) + pageViews('/matches'),
    opportunityViews30d: countEvents(rows, APP_EVENTS.OPPORTUNITY_VIEW),
    aiAssistCount30d: countEvents(rows, APP_EVENTS.AI_REQUEST),
    competencyTests30d: countEvents(rows, APP_EVENTS.COMPETENCY_COMPLETE),
    messagesSent30d: countEvents(rows, APP_EVENTS.MESSAGE_SEND),
    passportViews30d:
      countEvents(rows, APP_EVENTS.PASSPORT_VIEW) + pageViews('/passport'),
    topPages30d,
  }
}

export async function getOrgActivityInsights(
  organizationId: string
): Promise<OrgActivityInsights> {
  const supabase = await createClient()
  const since = since30d()

  const { data: events } = await supabase
    .from('app_events')
    .select('event_name, path, metadata')
    .eq('organization_id', organizationId)
    .gte('created_at', since)
    .limit(2000)

  const { data: scopedByMeta } = await supabase
    .from('app_events')
    .select('event_name, path, metadata')
    .gte('created_at', since)
    .contains('metadata', { organization_id: organizationId })
    .limit(1000)

  const rows = [...(events ?? []), ...(scopedByMeta ?? [])]

  const publicViews = rows.filter((r) => {
    if (r.event_name !== APP_EVENTS.PUBLIC_PASSPORT_VIEW) return false
    const meta = r.metadata as { volunteer_org?: string; volunteer_orgs?: string[] } | null
    if (meta?.volunteer_org === organizationId) return true
    return (meta?.volunteer_orgs ?? []).includes(organizationId)
  }).length

  return {
    dashboardViews30d: rows.filter(
      (r) => r.event_name === APP_EVENTS.PAGE_VIEW && r.path?.includes(`/organizations/${organizationId}/manage`)
    ).length,
    analyticsViews30d: rows.filter(
      (r) => r.event_name === APP_EVENTS.PAGE_VIEW && r.path?.includes(`/organizations/${organizationId}/analytics`)
    ).length,
    exports30d:
      countEvents(rows, APP_EVENTS.ORG_EXPORT) + countEvents(rows, APP_EVENTS.ORG_EXPORT_ESG),
    coordinatorActions30d:
      countEvents(rows, APP_EVENTS.ORG_COORDINATOR_APPROVE) +
      countEvents(rows, APP_EVENTS.ORG_COORDINATOR_REJECT) +
      countEvents(rows, APP_EVENTS.HOURS_VERIFY) +
      countEvents(rows, APP_EVENTS.COMPLETION_VERIFY),
    applicationsReceived30d: countEvents(rows, APP_EVENTS.APPLICATION_SUBMIT),
    publicPassportViews30d: publicViews,
    apiCalls30d: countEvents(rows, APP_EVENTS.ORG_API_CALL),
  }
}
