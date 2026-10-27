import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import VerifyHoursForm from '@/components/VerifyHoursForm'
import HoursRevokeAction from '@/components/HoursRevokeAction'
import ManageVolunteerFocus from '@/components/ManageVolunteerFocus'
import RequestCoordinatorAccess from '@/components/RequestCoordinatorAccess'
import CoordinatorRequestActions from '@/components/CoordinatorRequestActions'
import OrgStats from '@/components/OrgStats'
import HoursTrend from '@/components/HoursTrend'
import { formatDate } from '@/lib/constants'
import { getLocale } from '@/lib/locale'
import { getDictionary, localizeEventTitle } from '@/lib/i18n'
import { canManageOrg } from '@/lib/org-access'
import DemoNotice from '@/components/DemoNotice'
import RequestVerification from '@/components/RequestVerification'
import ImportEvents from '@/components/ImportEvents'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('name').eq('id', id).single()
  return { title: data ? `Manage ${data.name} | ImpactMap` : 'Organization Manage' }
}

export default async function OrganizationManagePage({ params }: PageProps) {
  const { id } = await params
  const t = getDictionary(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/organizations/${id}/manage`)
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, description, website, location, verified, created_at')
    .eq('id', id)
    .single()

  if (!organization) {
    notFound()
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: coordinatorRequest } = !membership
    ? await supabase
        .from('coordinator_requests')
        .select('status')
        .eq('organization_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null }

  const { data: pendingRequests } = membership
    ? await supabase
        .from('coordinator_requests')
        .select('id, user_id, message, created_at, profiles(full_name)')
        .eq('organization_id', id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
    : { data: [] }

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('id')
    .eq('organization_id', id)

  const oppIds = (opportunities ?? []).map((o) => o.id)

  let pendingHours: Array<{
    id: string
    hours: number
    date: string
    description: string | null
    user_id: string
    opportunity_id: string
  }> = []

  let verifiedHoursList: Array<{
    id: string
    hours: number
    date: string
    user_id: string
    opportunity_id: string
    verification_code: string | null
    verified_at: string | null
    revoked_at: string | null
  }> = []

  let checkins: Array<{
    id: string
    opportunity_id: string
    user_id: string
    checked_in_at: string
    distance_m: number | null
    outside_window: boolean
  }> = []


  if (oppIds.length > 0) {
    const { data: pending } = await supabase
      .from('volunteer_hours')
      .select('id, hours, date, description, user_id, opportunity_id')
      .in('opportunity_id', oppIds)
      .eq('verified', false)
      .order('created_at', { ascending: false })

    const { data: verified } = await supabase
      .from('volunteer_hours')
      .select('id, hours, date, user_id, opportunity_id, verification_code, verified_at, revoked_at')
      .in('opportunity_id', oppIds)
      .eq('verified', true)
      .order('verified_at', { ascending: false })

    const { data: attendance } = await supabase
      .from('event_checkins')
      .select('id, opportunity_id, user_id, checked_in_at, distance_m, outside_window')
      .in('opportunity_id', oppIds)
      .order('checked_in_at', { ascending: false })

    pendingHours = (pending ?? []).flatMap((h) =>
      h.user_id && h.opportunity_id
        ? [{ ...h, user_id: h.user_id, opportunity_id: h.opportunity_id }]
        : []
    )
    verifiedHoursList = (verified ?? []).flatMap((h) =>
      h.user_id && h.opportunity_id
        ? [{ ...h, user_id: h.user_id, opportunity_id: h.opportunity_id }]
        : []
    )
    checkins = attendance ?? []
  }

  const profileIds = [...new Set([
    ...pendingHours.map((h) => h.user_id),
    ...verifiedHoursList.map((h) => h.user_id),
    ...checkins.map((c) => c.user_id),
  ])]
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

  const { data: opps } = oppIds.length
    ? await supabase.from('opportunities').select('id, title').in('id', oppIds)
    : { data: [] }
  const oppMap = new Map((opps ?? []).map((o) => [o.id, localizeEventTitle(o.title, t)]))

  const attendanceByOpp = [
    ...checkins.reduce((groups, row) => {
      const list = groups.get(row.opportunity_id) ?? []
      list.push(row)
      groups.set(row.opportunity_id, list)
      return groups
    }, new Map<string, typeof checkins>()),
  ]

  const activeVerifiedHours = verifiedHoursList.filter((h) => !h.revoked_at)
  const revokedCount = verifiedHoursList.length - activeVerifiedHours.length
  const approvedForDisplay = [...verifiedHoursList].sort(
    (a, b) => Number(Boolean(b.revoked_at)) - Number(Boolean(a.revoked_at))
  )
  const totalVerified = activeVerifiedHours.reduce((s, h) => s + Number(h.hours), 0)
  const isCoordinator = await canManageOrg(id, user.id)
  const { data: me } = await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
  const approverName = me?.full_name || user.email || 'Organizer'

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <DemoNotice email={user.email} />
      <Suspense fallback={null}>
        <ManageVolunteerFocus />
      </Suspense>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Link href={`/organizations/${id}`} className="text-emerald-700 dark:text-emerald-400 text-sm hover:underline">
            ← {organization.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-3">Approve hours</h1>
          {!organization.verified && (
            <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">This organization is not verified yet.</p>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">You can still approve hours; verification adds a visible trust badge for counselors.</p>
              <div className="mt-3"><RequestVerification organizationId={id} /></div>
            </div>
          )}
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Students log hours after your event. Approve them here, and each student gets a code their counselor can check.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {!isCoordinator ? (
          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-xl p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white">Ask to help organize</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
              The owner of {organization.name} must approve you before you can approve student hours.
            </p>
            <RequestCoordinatorAccess
              organizationId={id}
              organizationName={organization.name}
              existingRequest={coordinatorRequest?.status as 'pending' | 'rejected' | undefined}
            />
          </div>
        ) : (
          <>
            {(pendingRequests ?? []).length > 0 && (
              <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">People asking to help organize</h2>
                <ul className="space-y-4">
                  {(pendingRequests ?? []).map((req) => (
                    <li key={req.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                      <p className="font-medium">{(req.profiles as { full_name?: string } | null)?.full_name ?? 'User'}</p>
                      {req.message && <p className="text-sm text-gray-600 mt-1">{req.message}</p>}
                      <div className="mt-3">
                        <CoordinatorRequestActions
                          requestId={req.id}
                          organizationId={id}
                          userId={req.user_id}
                          userName={(req.profiles as { full_name?: string } | null)?.full_name ?? 'User'}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ImportEvents organizationId={id} />

            <section>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hours to approve</h2>
              {pendingHours.length > 0 ? (
                <div className="space-y-4">
                  {pendingHours.map((entry) => (
                    <div key={entry.id} data-volunteer-id={entry.user_id} className="rounded-xl transition-shadow">
                      <VerifyHoursForm
                        hourId={entry.id}
                        organizationId={id}
                        volunteerName={profileMap.get(entry.user_id) || 'Student'}
                        hours={Number(entry.hours)}
                        date={formatDate(entry.date)}
                        description={entry.description}
                        opportunityTitle={oppMap.get(entry.opportunity_id) || 'Event'}
                        approverName={approverName}
                        approverEmail={user.email ?? null}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  You&apos;re all caught up. New hours show up here when students log them.
                </p>
              )}
            </section>

            <OrgStats
              pendingHours={pendingHours}
              verifiedHoursList={activeVerifiedHours}
              checkins={checkins}
              totalVerified={totalVerified}
              revokedCount={revokedCount}
              profileMap={profileMap}
              oppMap={oppMap}
            />

            <HoursTrend verifiedHoursList={activeVerifiedHours} />

            <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Attendance</h2>
              <p className="text-sm text-gray-500 mb-4">
                Recorded when volunteers scan an event&rsquo;s check-in QR on arrival. Attendance is not
                approval — you still approve the hours they log. If a volunteer shares their location,
                you see the approximate distance from the event; coordinates are never stored.
              </p>
              {attendanceByOpp.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No check-ins yet. Print the check-in QR on an event page and put it at the sign-in table.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {attendanceByOpp.map(([oppId, rows]) => (
                    <li key={oppId} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {oppMap.get(oppId) ?? 'Event'}
                        <span className="text-gray-500 font-normal"> · {rows.length} checked in</span>
                      </p>
                      <ul className="mt-2 space-y-1">
                        {rows.map((row) => (
                          <li key={row.id} className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {profileMap.get(row.user_id) || 'Student'}
                            </span>
                            <span>
                              {' · '}
                              {row.distance_m == null
                                ? 'location not shared'
                                : row.distance_m <= 250
                                  ? `${row.distance_m} m from the event`
                                  : `${(row.distance_m / 1000).toFixed(1)} km from the event`}
                            </span>
                            {row.outside_window && (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">
                                {' · outside event window'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {verifiedHoursList.length > 0 && (
              <section>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Approved</h2>
                  <div className="flex items-center gap-4">
                    <a href={`/api/org/${id}/export`} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
                      Download CSV
                    </a>
                    <a href={`/api/org/${id}/export?format=json`} className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
                      JSON
                    </a>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Misclicked an approval? Revoke it: the code stays on record and is marked revoked,
                  and the hours leave the student&rsquo;s total, the export and the impact page.
                  {revokedCount > 0 && ` ${revokedCount} revoked ${revokedCount === 1 ? 'record is' : 'records are'} excluded.`}
                </p>
                <ul className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                  {approvedForDisplay.slice(0, 20).map((h) => (
                    <li key={h.id} className="p-4 flex flex-wrap justify-between gap-3 items-center">
                      <div className={h.revoked_at ? 'opacity-60' : undefined}>
                        <p className="font-medium">{profileMap.get(h.user_id) || 'Student'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {oppMap.get(h.opportunity_id)} · {Number(h.hours)}h · {formatDate(h.date)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-4">
                        {h.verification_code && (
                          <a href={`/verify/${h.verification_code}`} className="font-mono text-sm text-emerald-700 dark:text-emerald-400 hover:underline" target="_blank" rel="noopener noreferrer">
                            {h.verification_code}
                          </a>
                        )}
                        <HoursRevokeAction
                          hourId={h.id}
                          volunteerName={profileMap.get(h.user_id) || 'Student'}
                          hours={Number(h.hours)}
                          revoked={Boolean(h.revoked_at)}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
