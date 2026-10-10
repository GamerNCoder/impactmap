import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IdVerificationBadge from '@/components/IdVerificationBadge'
import Link from 'next/link'
import { Suspense } from 'react'
import LogHoursForm from '@/components/LogHoursForm'
import DashboardQrFocus from '@/components/DashboardQrFocus'
import EventCard from '@/components/EventCard'
import { formatDate, statusColor, statusLabel } from '@/lib/constants'
import { getVolunteerMatches } from '@/lib/matching-data'
import { getUserCommitmentScore } from '@/lib/commitment-data'
import CommitmentBadge from '@/components/CommitmentBadge'
import { formatImpactValue } from '@/lib/impact-passport'

export const metadata = {
  title: 'Hub | ImpactMap',
  description: 'Your volunteer command center.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, skills, id_verification_status')
    .eq('id', user.id)
    .single()

  if (!profile?.skills?.length) {
    redirect('/onboarding')
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('*, opportunities(id, title, category, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select('*, opportunities(title)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const { data: hostedEvents } = await supabase
    .from('opportunities')
    .select('id, title, volunteers_count, volunteers_needed, status, organization_id, start_date')
    .eq('posted_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const acceptedApps = (applications || []).filter((a) => a.status === 'accepted' || a.status === 'completed')
  const { ranked: topMatches } = await getVolunteerMatches(user.id, 2)
  const bestMatches = topMatches.filter((r) => r.match.score >= 40)
  const commitment = await getUserCommitmentScore(user.id)
  const verifiedHours = (hours || []).filter((h) => h.verified).reduce((s, e) => s + Number(e.hours), 0)
  const pendingHours = (hours || []).filter((h) => !h.verified).length
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <Suspense fallback={null}>
        <DashboardQrFocus />
      </Suspense>
      {/* Command center header */}
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Your hub</p>
              <h1 className="text-3xl font-bold">Hey {firstName}</h1>
              <p className="mt-2 text-gray-400">Here&apos;s your impact at a glance.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <CommitmentBadge commitment={commitment} />
              <Link href="/passport" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                Impact Passport →
              </Link>
              <Link href="/scan" className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                Scan QR
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Verified hours', value: verifiedHours.toFixed(1), accent: true },
              { label: 'Impact value', value: formatImpactValue(verifiedHours), accent: false },
              { label: 'Active events', value: String(acceptedApps.length), accent: false },
              { label: 'Pending verify', value: String(pendingHours), accent: false },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className={`text-2xl font-bold ${stat.accent ? 'text-emerald-400' : 'text-white'}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ID verification prompt */}
        {profile?.id_verification_status !== 'verified' && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Identity verification</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {profile?.id_verification_status === 'pending'
                    ? 'Your ID is being reviewed. Hosts will see a verified badge once approved.'
                    : profile?.id_verification_status === 'rejected'
                      ? 'Your last ID submission was declined. Please upload a new document.'
                      : 'Submit your government ID, a live selfie, and a written statement to earn a verified certificate.'}
                </p>
              </div>
              <IdVerificationBadge status={profile?.id_verification_status} size="sm" />
            </div>
            {profile?.id_verification_status !== 'pending' && (
              <Link
                href="/profile"
                className="inline-block mt-4 text-sm font-semibold text-emerald-600 hover:underline"
              >
                Complete ID verification →
              </Link>
            )}
          </section>
        )}

        {/* Next actions */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
          <h2 className="font-bold text-lg mb-4">What to do next</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link href="/matches" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
              <p className="font-semibold">Check SkillMatch</p>
              <p className="text-sm text-emerald-100 mt-1">Find your best-fit events</p>
            </Link>
            <Link href="/opportunities" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
              <p className="font-semibold">Browse events</p>
              <p className="text-sm text-emerald-100 mt-1">Join with one click</p>
            </Link>
            <Link href="/opportunities/new" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
              <p className="font-semibold">Host an event</p>
              <p className="text-sm text-emerald-100 mt-1">Post and manage sign-ups</p>
            </Link>
          </div>
        </section>

        {hostedEvents && hostedEvents.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Events you&apos;re hosting</h2>
              <Link href="/opportunities/new" className="text-sm font-semibold text-emerald-600">+ Post another</Link>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {hostedEvents.map((event) => (
                <li key={event.id} className="py-4 first:pt-0 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/opportunities/${event.id}`} className="font-medium text-gray-900 dark:text-white hover:text-emerald-600">
                      {event.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.volunteers_count}{event.volunteers_needed != null ? ` / ${event.volunteers_needed}` : ''} joined
                      {event.start_date && ` · ${formatDate(event.start_date)}`}
                    </p>
                  </div>
                  {event.organization_id && (
                    <Link href={`/organizations/${event.organization_id}/manage`} className="text-sm font-semibold text-emerald-600">
                      Manage sign-ups →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {bestMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top SkillMatches</h2>
              <Link href="/matches" className="text-sm font-semibold text-emerald-600">See all →</Link>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {bestMatches.map((item) => {
                const org = item.opportunity.organizations as { name: string } | null
                return (
                  <EventCard
                    key={item.opportunity.id}
                    id={item.opportunity.id}
                    title={item.opportunity.title}
                    category={item.opportunity.category}
                    location={item.opportunity.location}
                    remote={item.opportunity.remote}
                    organizationName={org?.name}
                    volunteersNeeded={item.opportunity.volunteers_needed}
                    volunteersCount={item.opportunity.volunteers_count}
                    startDate={item.opportunity.start_date}
                    matchScore={item.match.score}
                  />
                )
              })}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Your sign-ups</h2>
            {applications && applications.length > 0 ? (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {applications.map((app) => {
                  const opp = app.opportunities as { id: string; title: string; category: string } | null
                  const verified = app.status === 'completed' && app.verification_code
                  return (
                    <li key={app.id} className="py-4 first:pt-0 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {opp ? (
                          <Link href={`/opportunities/${opp.id}`} className="font-medium text-gray-900 dark:text-white hover:text-emerald-600">
                            {opp.title}
                          </Link>
                        ) : (
                          <span className="font-medium">Unknown event</span>
                        )}
                        {opp && <p className="text-sm text-gray-500 mt-0.5">{opp.category}</p>}
                        {verified && (
                          <p className="text-xs mt-2">
                            <span className="font-mono text-emerald-600">{app.verification_code}</span>
                            {' · '}
                            <Link href={`/verify/${app.verification_code}`} className="text-emerald-600 hover:underline" target="_blank">
                              Public verify →
                            </Link>
                          </p>
                        )}
                        {app.status === 'accepted' && (
                          <p className="text-xs text-amber-600 mt-2">Awaiting coordinator completion verification</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor(app.status)}`}>
                        {statusLabel(app.status)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">
                No sign-ups yet.{' '}
                <Link href="/matches" className="text-emerald-600 font-medium">Find a match →</Link>
              </p>
            )}
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Log hours</h2>
            {acceptedApps.length > 0 ? (
              <div className="space-y-4">
                {acceptedApps.map((app) => {
                  const opp = app.opportunities as { id: string; title: string } | null
                  if (!opp) return null
                  return (
                    <div
                      key={app.id}
                      data-opportunity-id={opp.id}
                      className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 transition-shadow"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">{opp.title}</h3>
                      <LogHoursForm opportunityId={opp.id} opportunityTitle={opp.title} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">Join an event first, then log hours here.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
