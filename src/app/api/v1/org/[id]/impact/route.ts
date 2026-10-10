import { NextResponse } from 'next/server'
import { getOrgAnalytics } from '@/lib/org-analytics-data'
import { authenticateOrgApiKey } from '@/lib/org-api'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits } from '@/lib/plan-tiers'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const auth = request.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null

  const plan = await getOrgPlanContext(orgId)
  if (!plan || !planLimits(plan.planTier).apiAccess) {
    return NextResponse.json({ error: 'API not enabled for this organization' }, { status: 403 })
  }

  if (!(await authenticateOrgApiKey(orgId, token))) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const analytics = await getOrgAnalytics(orgId)
  if (!analytics) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  void trackAppEvent({
    event: APP_EVENTS.ORG_API_CALL,
    organizationId: orgId,
    metadata: { endpoint: 'impact' },
  })

  return NextResponse.json({
    organization_id: orgId,
    organization_name: analytics.organizationName,
    plan_tier: analytics.planTier,
    hour_valuation_usd: analytics.hourValuationUsd,
    summary: analytics.summary,
    hours_by_month: analytics.hoursByMonth,
    generated_at: new Date().toISOString(),
  })
}
