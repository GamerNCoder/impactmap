import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import LogHoursForm from '@/components/LogHoursForm'
import DashboardQrFocus from '@/components/DashboardQrFocus'
import HoursGoal from '@/components/HoursGoal'
import { formatDate } from '@/lib/constants'

export const metadata = {
  title: 'Home | ImpactMap',
  description: 'Log hours and track your goal.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, hours_goal')
    .eq('id', user.id)
    .single()

  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, opportunities(id, title, start_date)')
    .eq('user_id', user.id)
    .in('status', ['accepted', 'completed'])
    .order('created_at', { ascending: false })

  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select('hours, verified')
    .eq('user_id', user.id)

  const { data: hostedEvents } = await supabase
    .from('opportunities')
    .select('id, title, volunteers_count, volunteers_needed, organization_id, start_date')
    .eq('posted_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const joined = (applications ?? []).filter((a) => a.opportunities)
  const verifiedHours = (hours ?? []).filter((h) => h.verified).reduce((s, e) => s + Number(e.hours), 0)
  const pendingCount = (hours ?? []).filter((h) => !h.verified).length
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <Suspense fallback={null}>
        <DashboardQrFocus />
      </Suspense>
      <div className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl font-bold">Hey {firstName}</h1>
          <p className="mt-4 text-4xl font-extrabold">
            {verifiedHours.toFixed(1)}
            <span className="text-lg font-semibold text-emerald-100 ml-2">verified hours</span>
          </p>
          {pendingCount > 0 && (
            <p className="text-sm text-emerald-100 mt-1">
              {pendingCount} log{pendingCount === 1 ? '' : 's'} waiting for organizer approval
            </p>
          )}
          <div className="mt-5">
            <HoursGoal userId={user.id} verifiedHours={verifiedHours} goal={profile?.hours_goal ?? null} />
          </div>
          <Link href="/passport" className="inline-block mt-5 text-sm font-semibold underline underline-offset-4">
            My hours &amp; counselor report →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Log hours</h2>
          <p className="text-sm text-gray-500 mb-4">After an event, log your time. The organizer approves it.</p>
          {joined.length > 0 ? (
            <div className="space-y-4">
              {joined.map((app) => {
                const opp = app.opportunities as unknown as { id: string; title: string; start_date: string | null }
                return (
                  <div
                    key={app.id}
                    data-opportunity-id={opp.id}
                    className="border border-gray-100 dark:border-gray-800 rounded-xl p-4 transition-shadow"
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                      <Link href={`/opportunities/${opp.id}`} className="hover:text-emerald-600">{opp.title}</Link>
                      {opp.start_date && <span className="text-gray-500 font-normal"> · {formatDate(opp.start_date)}</span>}
                    </h3>
                    <LogHoursForm opportunityId={opp.id} opportunityTitle={opp.title} />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">You haven&apos;t joined an event yet.</p>
              <Link href="/opportunities" className="inline-block mt-3 bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-800">
                Find an event near you
              </Link>
            </div>
          )}
        </section>

        {hostedEvents && hostedEvents.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Events you&apos;re hosting</h2>
              <Link href="/opportunities/new" className="text-sm font-semibold text-emerald-700">+ Post another</Link>
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
                    <Link href={`/organizations/${event.organization_id}/manage`} className="text-sm font-semibold text-emerald-700">
                      Approve hours →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
