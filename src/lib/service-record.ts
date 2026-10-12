import type { createClient } from '@/lib/supabase/server'

type Client = Awaited<ReturnType<typeof createClient>>

export type VerifiedEntry = {
  code: string
  event: string
  organization: string
  hours: number | null
  date: string | null
  approver: string | null
}

export type ServiceRecord = {
  name: string
  goal: number | null
  verifiedHours: number
  verified: VerifiedEntry[]
  pending: { id: string; event: string; hours: number; date: string }[]
}

type OppJoin = { title: string; organizations: { name: string } | null } | null

/** A student's verified hours, coordinator-verified completions and pending logs, newest first. */
export async function getServiceRecord(supabase: Client, userId: string): Promise<ServiceRecord> {
  const [{ data: profile }, { data: hours }, { data: completions }] = await Promise.all([
    supabase.from('profiles').select('full_name, hours_goal').eq('id', userId).maybeSingle(),
    supabase
      .from('volunteer_hours')
      .select('id, hours, date, verified, verification_code, supervisor_name, opportunities(title, organizations(name))')
      .eq('user_id', userId)
      .order('date', { ascending: false }),
    supabase
      .from('applications')
      .select('verification_code, completed_at, supervisor_name, opportunities(title, organizations(name))')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('verification_code', 'is', null),
  ])

  const verified: VerifiedEntry[] = []
  const pending: ServiceRecord['pending'] = []
  for (const h of hours ?? []) {
    const opp = h.opportunities as unknown as OppJoin
    if (h.verified && h.verification_code) {
      verified.push({
        code: h.verification_code,
        event: opp?.title ?? 'Event',
        organization: opp?.organizations?.name ?? '',
        hours: Number(h.hours),
        date: h.date,
        approver: h.supervisor_name,
      })
    } else if (!h.verified) {
      pending.push({ id: h.id, event: opp?.title ?? 'Event', hours: Number(h.hours), date: h.date })
    }
  }
  for (const c of completions ?? []) {
    const opp = c.opportunities as unknown as OppJoin
    verified.push({
      code: c.verification_code!,
      event: opp?.title ?? 'Event',
      organization: opp?.organizations?.name ?? '',
      hours: null,
      date: c.completed_at?.split('T')[0] ?? null,
      approver: c.supervisor_name,
    })
  }
  verified.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))

  return {
    name: profile?.full_name || 'Student',
    goal: profile?.hours_goal ?? null,
    verifiedHours: verified.reduce((sum, v) => sum + (v.hours ?? 0), 0),
    verified,
    pending,
  }
}
