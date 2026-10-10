import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isPlatformAdmin } from '@/lib/platform-admin'
import { PLAN_TIERS } from '@/lib/plan-tiers'
import { logSecurityEvent } from '@/lib/audit'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { plan_tier?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const tier = body.plan_tier
  if (!tier || !PLAN_TIERS.includes(tier as (typeof PLAN_TIERS)[number])) {
    return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })
  }

  const { error } = await supabase
    .from('organizations')
    .update({ plan_tier: tier, updated_at: new Date().toISOString() })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logSecurityEvent(user.id, 'org.verify', 'organizations', orgId, { plan_tier: tier })

  return NextResponse.json({ ok: true, plan_tier: tier })
}
