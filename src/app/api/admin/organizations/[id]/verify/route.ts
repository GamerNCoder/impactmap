import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isPlatformAdmin } from '@/lib/platform-admin'
import { logSecurityEvent } from '@/lib/audit'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await isPlatformAdmin(user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: org, error: updateError } = await supabase
    .from('organizations')
    .update({ verified: true, updated_at: new Date().toISOString() })
    .eq('id', orgId)
    .select('id, name')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  await logSecurityEvent(user.id, 'org.verify', 'organizations', orgId, {
    organization_name: org.name,
  })

  void trackAppEvent({
    event: APP_EVENTS.ORG_VERIFY,
    userId: user.id,
    organizationId: orgId,
  })

  return NextResponse.json({ ok: true, organization: org })
}
