import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg } from '@/lib/org-access'
import { logSecurityEvent } from '@/lib/audit'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string; requestId: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  const { id: orgId, requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await canManageOrg(orgId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { status?: 'approved' | 'rejected' }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const status = body.status
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { data: coordRequest } = await supabase
    .from('coordinator_requests')
    .select('user_id, status')
    .eq('id', requestId)
    .eq('organization_id', orgId)
    .maybeSingle()

  if (!coordRequest || coordRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (status === 'approved') {
    const { data: existing } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', coordRequest.user_id)
      .maybeSingle()

    if (!existing) {
      const { error: memberError } = await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: coordRequest.user_id,
        role: 'coordinator',
      })
      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 400 })
      }
    }
  }

  const now = new Date().toISOString()
  await supabase
    .from('coordinator_requests')
    .update({ status, reviewed_by: user.id, reviewed_at: now })
    .eq('id', requestId)

  await logSecurityEvent(
    user.id,
    status === 'approved' ? 'org.coordinator.approve' : 'org.coordinator.reject',
    'coordinator_requests',
    requestId,
    { organization_id: orgId, target_user_id: coordRequest.user_id }
  )

  void trackAppEvent({
    event: status === 'approved' ? APP_EVENTS.ORG_COORDINATOR_APPROVE : APP_EVENTS.ORG_COORDINATOR_REJECT,
    userId: user.id,
    organizationId: orgId,
    resourceType: 'coordinator_requests',
    resourceId: requestId,
  })

  return NextResponse.json({ ok: true, status })
}
