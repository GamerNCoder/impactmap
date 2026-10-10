import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import VerifyHoursForm from '@/components/VerifyHoursForm'
import ManageVolunteerFocus from '@/components/ManageVolunteerFocus'
import QrScanLauncher from '@/components/QrScanLauncher'
import RequestCoordinatorAccess from '@/components/RequestCoordinatorAccess'
import CoordinatorRequestActions from '@/components/CoordinatorRequestActions'
import ApplicationActionButtons from '@/components/ApplicationActionButtons'
import VerifyCompletionForm from '@/components/VerifyCompletionForm'
import RateVolunteerForm from '@/components/RateVolunteerForm'
import { formatDate } from '@/lib/constants'
import { getOrgReviewLookup } from '@/lib/volunteer-reviews'
import { canManageOrg } from '@/lib/org-access'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import OrgPlanBadge from '@/components/OrgPlanBadge'

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/organizations/${id}/manage`)
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
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
  }> = []

  let verifiedHours: Array<{ hours: number; verified_at: string | null }> = []

  if (oppIds.length > 0) {
    const { data: pending } = await supabase
      .from('volunteer_hours')
      .select('id, hours, date, description, user_id, opportunity_id')
      .in('opportunity_id', oppIds)
      .eq('verified', false)
      .order('created_at', { ascending: false })

    const { data: verified } = await supabase
      .from('volunteer_hours')
      .select('id, hours, date, user_id, opportunity_id, verification_code, verified_at')
      .in('opportunity_id', oppIds)
      .eq('verified', true)
      .order('verified_at', { ascending: false })

    pendingHours = pending ?? []
    verifiedHoursList = verified ?? []
    verifiedHours = verified ?? []
  }

  const profileIds = [...new Set([
    ...pendingHours.map((h) => h.user_id),
    ...verifiedHoursList.map((h) => h.user_id),
  ])]
  const { data: profiles } = profileIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]))

  const { data: opps } = oppIds.length
    ? await supabase.from('opportunities').select('id, title').in('id', oppIds)
    : { data: [] }
  const oppMap = new Map((opps ?? []).map((o) => [o.id, o.title]))

  const { data: applications } = oppIds.length
    ? await supabase
        .from('applications')
        .select('id, status, user_id, opportunity_id, created_at, verification_code, completed_at')
        .in('opportunity_id', oppIds)
        .in('status', ['accepted', 'pending', 'completed'])
        .order('created_at', { ascending: false })
    : { data: [] }

  const joinedApps = (applications ?? []).filter((a) => a.status === 'accepted')
  const verifiedCompletions = (applications ?? []).filter(
    (a) => a.status === 'completed' && a.verification_code
  )

  const appUserIds = [...new Set((applications ?? []).map((a) => a.user_id))]
  const { data: appProfiles } = appUserIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', appUserIds)
    : { data: [] }
  const appProfileMap = new Map((appProfiles ?? []).map((p) => [p.id, p.full_name]))

  const totalVerified = verifiedHours.reduce((s, h) => s + Number(h.hours), 0)
  const isCoordinator = await canManageOrg(id, user.id)
  const plan = await getOrgPlanContext(id)
  const reviewLookup = isCoordinator ? await getOrgReviewLookup(id) : new Map()
  const unratedCompletions = verifiedCompletions.filter((a) => !reviewLookup.has(a.id))
  const unratedHours = verifiedHoursList.filter((h) => !reviewLookup.has(h.id))

  return (
    <div className="bg-gray-50 min-h-full">
      <Suspense fallback={null}>
        <ManageVolunteerFocus />
      </Suspense>
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={`/organizations/${id}`} className="text-indigo-600 text-sm hover:underline">
            ← Back to {organization.name}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coordinator dashboard</h1>
              <p className="text-gray-600 mt-1">Verify hours, track placements, and export grant reports.</p>
            </div>
            {plan && <OrgPlanBadge planTier={plan.planTier} verified={plan.verified} />}
            {isCoordinator && (
              <QrScanLauncher label="Scan volunteer QR" className="shrink-0" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!isCoordinator ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900">Request coordinator access</h2>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Coordinators verify volunteer hours, issue Impact Passport credentials, and export funder reports for {organization.name}.
              Access requires approval from an existing organization owner.
            </p>
            <RequestCoordinatorAccess
              organizationId={id}
              organizationName={organization.name}
              existingRequest={coordinatorRequest?.status as 'pending' | 'rejected' | undefined}
            />
          </div>
        ) : (
          <>
            {organization.verified && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-800">
                ✓ Verified organization — your credentials carry institutional trust for funders and partners.
              </div>
            )}

            {(pendingRequests ?? []).length > 0 && (
              <section className="bg-white rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending coordinator requests</h2>
                <ul className="space-y-4">
                  {(pendingRequests ?? []).map((req) => (
                    <li key={req.id} className="border rounded-lg p-4">
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
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-5">
                <p className="text-sm text-gray-500">Verified hours (all time)</p>
                <p className="text-2xl font-bold text-gray-900">{totalVerified.toFixed(1)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5">
                <p className="text-sm text-gray-500">Grant report value</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
                    totalVerified * (plan?.hourValuationUsd ?? 33.49)
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">${plan?.hourValuationUsd ?? 33.49}/hr</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-5">
                <p className="text-sm text-gray-500">Pending verification</p>
                <p className="text-2xl font-bold text-amber-600">{pendingHours.length}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/organizations/${id}/analytics`}
                className="inline-flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                View analytics
              </Link>
              <a
                href={`/api/org/${id}/export`}
                className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Download grant-ready CSV
              </a>
              {plan && plan.coordinatorCount >= plan.coordinatorSeatLimit && (
                <span className="text-sm text-amber-700 self-center">
                  Coordinator seats full ({plan.coordinatorCount}/{plan.coordinatorSeatLimit})
                </span>
              )}
            </div>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending hour verifications</h2>
              {pendingHours.length > 0 ? (
                <div className="space-y-4">
                  {pendingHours.map((entry) => (
                    <div key={entry.id} data-volunteer-id={entry.user_id} className="rounded-xl transition-shadow">
                      <VerifyHoursForm
                        hourId={entry.id}
                        volunteerId={entry.user_id}
                        organizationId={id}
                        opportunityId={entry.opportunity_id}
                        volunteerName={profileMap.get(entry.user_id) || 'Volunteer'}
                        hours={Number(entry.hours)}
                        date={formatDate(entry.date)}
                        opportunityTitle={oppMap.get(entry.opportunity_id) || 'Role'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white rounded-lg p-6 shadow-sm">No hours awaiting verification.</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Verify task completion ({joinedApps.length} awaiting)
              </h2>
              {joinedApps.length > 0 ? (
                <div className="space-y-4">
                  {joinedApps.map((app) => (
                    <div key={app.id} data-volunteer-id={app.user_id} className="rounded-xl transition-shadow">
                      <VerifyCompletionForm
                        applicationId={app.id}
                        volunteerId={app.user_id}
                        organizationId={id}
                        opportunityId={app.opportunity_id}
                        volunteerName={appProfileMap.get(app.user_id) || 'Volunteer'}
                        opportunityTitle={oppMap.get(app.opportunity_id) || 'Event'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 bg-white rounded-lg p-6 shadow-sm">No sign-ups awaiting completion verification.</p>
              )}
            </section>

            {(unratedCompletions.length > 0 || unratedHours.length > 0) && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Rate volunteers ({unratedCompletions.length + unratedHours.length} awaiting review)
                </h2>
                <div className="space-y-4">
                  {unratedCompletions.map((app) => (
                    <RateVolunteerForm
                      key={app.id}
                      volunteerId={app.user_id}
                      volunteerName={appProfileMap.get(app.user_id) || 'Volunteer'}
                      organizationId={id}
                      opportunityId={app.opportunity_id}
                      opportunityTitle={oppMap.get(app.opportunity_id) || 'Event'}
                      applicationId={app.id}
                    />
                  ))}
                  {unratedHours.map((entry) => (
                    <RateVolunteerForm
                      key={entry.id}
                      volunteerId={entry.user_id}
                      volunteerName={profileMap.get(entry.user_id) || 'Volunteer'}
                      organizationId={id}
                      opportunityId={entry.opportunity_id}
                      opportunityTitle={oppMap.get(entry.opportunity_id) || 'Role'}
                      volunteerHoursId={entry.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {verifiedCompletions.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Verified completions ({verifiedCompletions.length})
                </h2>
                <ul className="bg-white rounded-lg shadow-sm divide-y">
                  {verifiedCompletions.map((app) => (
                    <li key={app.id} className="p-4 flex flex-wrap justify-between gap-3 items-center">
                      <div>
                        <p className="font-medium">{appProfileMap.get(app.user_id) || 'Volunteer'}</p>
                        <p className="text-sm text-gray-600">{oppMap.get(app.opportunity_id)}</p>
                        {app.completed_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed {formatDate(app.completed_at.split('T')[0])}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-emerald-600">{app.verification_code}</p>
                        <a
                          href={`/verify/${app.verification_code}`}
                          className="text-xs text-emerald-600 hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Public verify →
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending applications</h2>
              {(applications ?? []).filter((a) => a.status === 'pending').length > 0 ? (
                <ul className="bg-white rounded-lg shadow-sm divide-y">
                  {(applications ?? []).filter((a) => a.status === 'pending').map((app) => (
                      <li key={app.id} className="p-4 flex flex-wrap justify-between gap-3 items-center">
                        <div>
                          <p className="font-medium">{appProfileMap.get(app.user_id) || 'Volunteer'}</p>
                          <p className="text-sm text-gray-600">{oppMap.get(app.opportunity_id)}</p>
                          <span className="text-xs capitalize text-gray-500">{app.status}</span>
                        </div>
                        <ApplicationActionButtons
                          applicationId={app.id}
                          volunteerName={appProfileMap.get(app.user_id) || 'Volunteer'}
                          organizationId={id}
                        />
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500 bg-white rounded-lg p-6 shadow-sm">No pending applications.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
