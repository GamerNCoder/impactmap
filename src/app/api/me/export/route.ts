import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * The portability half of the privacy promise: the signed-in user downloads everything
 * ImpactMap holds about them as one JSON file.
 *
 * Every read is the user's own data, so row level security does the filtering for us:
 *   profiles            — private columns (date_of_birth, phone, guardian, terms) are NOT
 *                         granted to `authenticated`, so they come from my_profile()
 *   volunteer_hours     — "Volunteers see own hours"
 *   applications        — "Volunteers see own applications"
 *   event_checkins      — "Volunteers read their own check-in"
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profileResult, hoursResult, applicationsResult, checkinsResult] = await Promise.all([
    // SECURITY DEFINER RPC: returns the caller's own profiles row, private columns included.
    supabase.rpc('my_profile'),
    supabase
      .from('volunteer_hours')
      .select(
        'id, opportunity_id, date, hours, description, verified, verified_at, verification_code, supervisor_name, supervisor_title, supervisor_email, supervisor_notes, created_at, opportunities(title, category, location, remote, organizations(name))'
      )
      .eq('user_id', user.id)
      .order('date', { ascending: false }),
    supabase
      .from('applications')
      .select(
        'id, opportunity_id, status, cover_letter, availability, experience, no_show, completed_at, verified_at, verification_code, supervisor_name, supervisor_title, supervisor_email, supervisor_notes, created_at, opportunities(title, category, location, remote, organizations(name))'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('event_checkins')
      .select(
        'id, opportunity_id, checked_in_at, source, opportunities(title, organizations(name))'
      )
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false }),
  ])

  const failures = [profileResult, hoursResult, applicationsResult, checkinsResult].filter(
    (result) => result.error
  )

  // A partial export would be worse than none: the user cannot tell what is missing from it.
  if (failures.length > 0) {
    console.error('export: could not assemble user data', failures.map((f) => f.error))
    return NextResponse.json({ error: 'Could not assemble your export' }, { status: 500 })
  }

  const profile = ((profileResult.data as unknown as Record<string, unknown>[] | null) ?? [])[0] ?? null

  const payload = {
    meta: {
      generated_at: new Date().toISOString(),
      format: 'impactmap.account-export.v1',
      note:
        'This file contains the personal data ImpactMap stores for your account: your profile, the volunteer hours you logged, your event applications and your QR check-ins. Organizers you volunteered for can see your name and the hours you logged for their events — that copy belongs to them and is not in this file.',
    },
    account: {
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      created_at: user.created_at ?? null,
      last_sign_in_at: user.last_sign_in_at ?? null,
    },
    profile,
    volunteer_hours: hoursResult.data ?? [],
    applications: applicationsResult.data ?? [],
    event_check_ins: checkinsResult.data ?? [],
  }

  const filename = `impactmap-my-data-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
