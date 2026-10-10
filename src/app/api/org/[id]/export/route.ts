import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg } from '@/lib/org-access'
import { logSecurityEvent } from '@/lib/audit'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await canManageOrg(orgId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plan = await getOrgPlanContext(orgId)
  const hourRate = plan?.hourValuationUsd ?? 33.49

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, category')
    .eq('organization_id', orgId)

  const oppIds = (opportunities ?? []).map((o) => o.id)
  if (oppIds.length === 0) {
    return new NextResponse('No opportunities', { status: 404 })
  }

  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select(`
      hours,
      date,
      verified,
      verified_at,
      verification_code,
      supervisor_name,
      description,
      user_id,
      opportunity_id
    `)
    .in('opportunity_id', oppIds)
    .eq('verified', true)
    .order('date', { ascending: false })

  const { data: verifiedCompletions } = await supabase
    .from('applications')
    .select(`
      completed_at,
      verified_at,
      verification_code,
      supervisor_name,
      supervisor_notes,
      user_id,
      opportunity_id
    `)
    .in('opportunity_id', oppIds)
    .eq('status', 'completed')
    .not('verification_code', 'is', null)
    .order('verified_at', { ascending: false })

  const hourUserIds = [...new Set((hours ?? []).map((h) => h.user_id))]
  const completionUserIds = [...new Set((verifiedCompletions ?? []).map((c) => c.user_id))]
  const allUserIds = [...new Set([...hourUserIds, ...completionUserIds])]
  const { data: profiles } = allUserIds.length
    ? await supabase.from('profiles').select('id, full_name, email').in('id', allUserIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const oppMap = new Map((opportunities ?? []).map((o) => [o.id, o]))

  const header = [
    'Record Type',
    'Volunteer Name',
    'Volunteer Email',
    'Opportunity',
    'Category',
    'Date',
    'Hours',
    'Estimated Value USD',
    'Verification Code',
    'Verified At',
    'Supervisor',
    'Notes',
  ]

  const hourRows = (hours ?? []).map((h) => {
    const profile = profileMap.get(h.user_id)
    const opp = oppMap.get(h.opportunity_id)
    const value = (Number(h.hours) * hourRate).toFixed(2)
    return [
      'Service hours',
      profile?.full_name ?? '',
      profile?.email ?? '',
      opp?.title ?? '',
      opp?.category ?? '',
      h.date,
      String(h.hours),
      value,
      h.verification_code ?? '',
      h.verified_at ?? '',
      h.supervisor_name ?? '',
      (h.description ?? '').replace(/"/g, '""'),
    ]
  })

  const completionRows = (verifiedCompletions ?? []).map((c) => {
    const profile = profileMap.get(c.user_id)
    const opp = oppMap.get(c.opportunity_id)
    const date = c.completed_at?.split('T')[0] ?? ''
    return [
      'Task completion',
      profile?.full_name ?? '',
      profile?.email ?? '',
      opp?.title ?? '',
      opp?.category ?? '',
      date,
      '',
      '',
      c.verification_code ?? '',
      c.verified_at ?? '',
      c.supervisor_name ?? '',
      (c.supervisor_notes ?? '').replace(/"/g, '""'),
    ]
  })

  const rows = [...hourRows, ...completionRows]
  const csv = [
    header.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const filename = `${(organization?.name ?? 'org').replace(/\s+/g, '-').toLowerCase()}-impact-report.csv`

  await logSecurityEvent(user.id, 'org.export', 'organizations', orgId, {
    row_count: rows.length,
    filename,
  })

  void trackAppEvent({
    event: APP_EVENTS.ORG_EXPORT,
    userId: user.id,
    organizationId: orgId,
    metadata: { row_count: rows.length },
  })

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
