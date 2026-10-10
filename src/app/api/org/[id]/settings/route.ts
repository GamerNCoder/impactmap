import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg, isOrgOwner } from '@/lib/org-access'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits } from '@/lib/plan-tiers'
import { logSecurityEvent } from '@/lib/audit'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isOrgOwner(orgId, user.id)) && !(await canManageOrg(orgId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plan = await getOrgPlanContext(orgId)
  if (!plan || !planLimits(plan.planTier).customValuation) {
    return NextResponse.json({ error: 'Custom valuation requires Growth plan or higher' }, { status: 403 })
  }

  let body: { hour_valuation_usd?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rate = body.hour_valuation_usd
  if (rate == null || rate <= 0 || rate > 500) {
    return NextResponse.json({ error: 'Rate must be between 1 and 500' }, { status: 400 })
  }

  const { error } = await supabase
    .from('organizations')
    .update({ hour_valuation_usd: rate, updated_at: new Date().toISOString() })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logSecurityEvent(user.id, 'org.settings.valuation', 'organizations', orgId, { hour_valuation_usd: rate })

  void trackAppEvent({
    event: APP_EVENTS.ORG_SETTINGS,
    userId: user.id,
    organizationId: orgId,
    metadata: { hour_valuation_usd: rate },
  })

  return NextResponse.json({ ok: true, hour_valuation_usd: rate })
}
