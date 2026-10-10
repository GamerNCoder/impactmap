import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg } from '@/lib/org-access'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits } from '@/lib/plan-tiers'
import { generateWebhookSecret } from '@/lib/org-api'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await canManageOrg(orgId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plan = await getOrgPlanContext(orgId)
  if (!plan || !planLimits(plan.planTier).webhooks) {
    return NextResponse.json({ error: 'Webhooks require Enterprise plan' }, { status: 403 })
  }

  let body: { url?: string; events?: string[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const url = body.url?.trim()
  if (!url?.startsWith('https://')) {
    return NextResponse.json({ error: 'HTTPS webhook URL required' }, { status: 400 })
  }

  const events = body.events?.length ? body.events : ['hours.verified', 'application.completed']
  const secret = generateWebhookSecret()

  const { error } = await supabase.from('org_webhooks').insert({
    organization_id: orgId,
    url,
    events,
    secret,
    active: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void trackAppEvent({
    event: APP_EVENTS.WEBHOOK_REGISTER,
    userId: user.id,
    organizationId: orgId,
    metadata: { events },
  })

  return NextResponse.json({ ok: true, secret, events })
}
