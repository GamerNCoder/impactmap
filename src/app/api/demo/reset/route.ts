import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  DEMO_EVENT_ID,
  DEMO_ORG_ID,
  DEMO_PENDING_HOURS_ID,
  DEMO_STUDENT_EMAIL,
  demoEnabled,
} from '@/lib/demo'

export const dynamic = 'force-dynamic'

/**
 * Restore the shared demo's single-use pending log so the next visitor can
 * experience the one-tap approval flow. Demo-only; the service key never
 * reaches the browser.
 */
export async function POST(request: NextRequest) {
  if (!demoEnabled()) {
    return NextResponse.json({ error: 'Demo is not configured.' }, { status: 503 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'Demo storage is not configured.' }, { status: 503 })
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('email', DEMO_STUDENT_EMAIL)
    .maybeSingle()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Demo student is missing.' }, { status: 503 })
  }

  const { data: event } = await admin
    .from('opportunities')
    .select('id')
    .eq('id', DEMO_EVENT_ID)
    .eq('organization_id', DEMO_ORG_ID)
    .maybeSingle()

  if (!event) {
    return NextResponse.json({ error: 'Demo event is missing.' }, { status: 503 })
  }

  const date = new Date(Date.now() - 864e5).toISOString().slice(0, 10)

  const { error: hoursError } = await admin.from('volunteer_hours').upsert(
    {
      id: DEMO_PENDING_HOURS_ID,
      user_id: profile.id,
      opportunity_id: DEMO_EVENT_ID,
      date,
      hours: 2,
      description: 'Helped two students with fractions and reading.',
      verified: false,
      verified_by: null,
      verified_at: null,
      verification_code: null,
      supervisor_name: null,
      supervisor_title: null,
      supervisor_email: null,
      supervisor_notes: null,
    },
    { onConflict: 'id' }
  )

  if (hoursError) {
    return NextResponse.json({ error: 'Could not reset the demo.' }, { status: 500 })
  }

  await admin.from('profiles').update({ full_name: 'Demo Student' }).eq('id', profile.id)

  return NextResponse.redirect(new URL('/demo?reset=1', request.url))
}
