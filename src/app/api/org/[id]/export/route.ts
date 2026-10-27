import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg } from '@/lib/org-access'
import { logSecurityEvent } from '@/lib/audit'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

function csvCell(value: unknown): string {
  const text = String(value ?? '')
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${guarded.replace(/"/g, '""')}"`
}

function safeFilename(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'org'
}

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteParams) {
  const format = new URL(request.url).searchParams.get('format')
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await canManageOrg(orgId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
    .is('revoked_at', null)
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

  const hourUserIds = [...new Set((hours ?? []).map((h) => h.user_id).filter((id): id is string => Boolean(id)))]
  const completionUserIds = [...new Set((verifiedCompletions ?? []).map((c) => c.user_id).filter((id): id is string => Boolean(id)))]
  const allUserIds = [...new Set([...hourUserIds, ...completionUserIds])]
  const { data: profiles } = allUserIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', allUserIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
  const oppMap = new Map((opportunities ?? []).map((o) => [o.id, o]))

  const header = [
    'Record Type',
    'Volunteer Name',
    'Opportunity',
    'Category',
    'Date',
    'Hours',
    'Verification Code',
    'Verified At',
    'Supervisor',
    'Notes',
  ]

  const hourRows = (hours ?? []).map((h) => {
    const profile = h.user_id ? profileMap.get(h.user_id) : undefined
    const opp = h.opportunity_id ? oppMap.get(h.opportunity_id) : undefined
    return [
      'Service hours',
      profile?.full_name ?? '',
      opp?.title ?? '',
      opp?.category ?? '',
      h.date,
      String(h.hours),
      h.verification_code ?? '',
      h.verified_at ?? '',
      h.supervisor_name ?? '',
      (h.description ?? '').replace(/"/g, '""'),
    ]
  })

  const completionRows = (verifiedCompletions ?? []).map((c) => {
    const profile = c.user_id ? profileMap.get(c.user_id) : undefined
    const opp = c.opportunity_id ? oppMap.get(c.opportunity_id) : undefined
    const date = c.completed_at?.split('T')[0] ?? ''
    return [
      'Task completion',
      profile?.full_name ?? '',
      opp?.title ?? '',
      opp?.category ?? '',
      date,
      '',
      c.verification_code ?? '',
      c.verified_at ?? '',
      c.supervisor_name ?? '',
      (c.supervisor_notes ?? '').replace(/"/g, '""'),
    ]
  })

  const rows = [...hourRows, ...completionRows]
  const csv = [
    header.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\n')

  const filename = `${safeFilename(organization?.name ?? 'org')}-impact-report.csv`

  if (format === 'json') {
    return NextResponse.json({
      organization: organization?.name ?? null,
      generated_at: new Date().toISOString(),
      rows,
    }, { headers: { 'Cache-Control': 'no-store' } })
  }

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
