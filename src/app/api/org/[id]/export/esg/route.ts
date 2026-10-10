import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canManageOrg } from '@/lib/org-access'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits } from '@/lib/plan-tiers'
import { logSecurityEvent } from '@/lib/audit'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ id: string }> }

/** ESG / CSR export with standardized impact mapping columns. */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id: orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await canManageOrg(orgId, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plan = await getOrgPlanContext(orgId)
  if (!plan || !planLimits(plan.planTier).esgExport) {
    return NextResponse.json({ error: 'ESG export requires Enterprise plan' }, { status: 403 })
  }

  const hourRate = plan.hourValuationUsd

  const { data: organization } = await supabase
    .from('organizations')
    .select('name, verified')
    .eq('id', orgId)
    .single()

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id, title, category')
    .eq('organization_id', orgId)

  const oppIds = (opportunities ?? []).map((o) => o.id)
  if (oppIds.length === 0) {
    return new NextResponse('No data', { status: 404 })
  }

  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select('hours, date, verified_at, verification_code, user_id, opportunity_id')
    .in('opportunity_id', oppIds)
    .eq('verified', true)
    .order('date', { ascending: false })

  const userIds = [...new Set((hours ?? []).map((h) => h.user_id))].filter(Boolean) as string[]
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] }
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? '']))
  const oppMap = new Map((opportunities ?? []).map((o) => [o.id, o]))

  const header = [
    'ESG_Pillar',
    'CSR_Category',
    'Activity_Type',
    'Volunteer_Name',
    'Program',
    'Social_Impact_Area',
    'Activity_Date',
    'Volunteer_Hours',
    'Economic_Value_USD',
    'Verification_Code',
    'Verified_At',
    'Organization',
    'Org_Verified',
  ]

  const esgPillar = 'Social'
  const csrCategory = 'Community_Engagement'

  const rows = (hours ?? []).map((h) => {
    const opp = oppMap.get(h.opportunity_id)
    const value = (Number(h.hours) * hourRate).toFixed(2)
    return [
      esgPillar,
      csrCategory,
      'Volunteer_Service',
      profileMap.get(h.user_id) ?? '',
      opp?.title ?? '',
      opp?.category ?? '',
      h.date,
      String(h.hours),
      value,
      h.verification_code ?? '',
      h.verified_at ?? '',
      organization?.name ?? '',
      organization?.verified ? 'Yes' : 'No',
    ]
  })

  const csv = [
    header.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  const filename = `${(organization?.name ?? 'org').replace(/\s+/g, '-').toLowerCase()}-esg-impact.csv`

  await logSecurityEvent(user.id, 'org.export', 'organizations', orgId, {
    export_type: 'esg',
    row_count: rows.length,
    filename,
  })

  void trackAppEvent({
    event: APP_EVENTS.ORG_EXPORT_ESG,
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
