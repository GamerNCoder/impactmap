import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg } from '@/lib/org-access'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits } from '@/lib/plan-tiers'
import { generateApiKey } from '@/lib/org-api'
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
  if (!plan || !planLimits(plan.planTier).apiAccess) {
    return NextResponse.json({ error: 'API access requires Enterprise plan' }, { status: 403 })
  }

  let body: { name?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const { key, prefix, hash } = generateApiKey()
  const { error } = await supabase.from('org_api_keys').insert({
    organization_id: orgId,
    name: body.name?.trim() || 'API key',
    key_hash: hash,
    key_prefix: prefix,
    created_by: user.id,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void trackAppEvent({
    event: APP_EVENTS.API_KEY_CREATE,
    userId: user.id,
    organizationId: orgId,
  })

  return NextResponse.json({ key, prefix })
}
