import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnalyticsBarChart from '@/components/AnalyticsBarChart'
import EngagementBadge from '@/components/EngagementBadge'
import { getVolunteerAnalytics } from '@/lib/volunteer-analytics-data'
import { getUserManagedOrganizations } from '@/lib/org-plan-data'
import { getMultiOrgRollup } from '@/lib/org-analytics-data'
import { formatImpactValue } from '@/lib/impact-passport'

export const metadata = {
  title: 'Your Analytics | ImpactMap',
  description: 'Track your volunteer impact, engagement, and match performance.',
}

export default async function VolunteerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard/analytics')

  const analytics = await getVolunteerAnalytics(user.id)
  const managedOrgs = await getUserManagedOrganizations(user.id)
  const rollup = managedOrgs.length > 0 ? await getMultiOrgRollup(user.id) : null
  const { summary } = analytics

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Volunteer analytics</p>
          <h1 className="text-3xl font-bold">How you&apos;re doing</h1>
          <p className="mt-2 text-gray-400">
            Hours, applications, engagement, and match quality — updated from your real activity.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard" className="text-sm text-emerald-300 hover:underline">← Back to Hub</Link>
            <Link href="/matches" className="text-sm text-gray-300 hover:underline">Discover matches</Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <EngagementBadge status={summary.engagementStatus} />
          {summary.daysSinceLastActivity !== null && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Last activity {summary.daysSinceLastActivity} day{summary.daysSinceLastActivity === 1 ? '' : 's'} ago
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Verified hours', value: summary.verifiedHours.toFixed(1) },
            { label: 'Impact value', value: formatImpactValue(summary.verifiedHours) },
            { label: 'Commitment score', value: `${summary.commitmentScore} — ${summary.commitmentLabel}` },
            { label: 'Avg match score', value: `${summary.avgMatchScore}%` },
            { label: 'Applications', value: String(summary.applicationsTotal) },
            { label: 'Completed events', value: String(summary.applicationsCompleted) },
            { label: 'Skills verified', value: `${summary.verifiedSkills}/${summary.profileSkills}` },
            { label: 'Credentials', value: String(summary.credentialsCount) },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Your engagement (30 days)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.hubVisits30d}</p>
              <p className="text-gray-500">Hub visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.matchPageViews30d}</p>
              <p className="text-gray-500">Match browsing</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.aiAssistCount30d}</p>
              <p className="text-gray-500">AI assists</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.competencyTests30d}</p>
              <p className="text-gray-500">Skills verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.opportunityViews30d}</p>
              <p className="text-gray-500">Roles explored</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.messagesSent30d}</p>
              <p className="text-gray-500">Messages sent</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.passportViews30d}</p>
              <p className="text-gray-500">Passport views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.analyticsViews30d}</p>
              <p className="text-gray-500">Analytics visits</p>
            </div>
          </div>
          {analytics.activity.topPages30d.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Most visited pages</p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {analytics.activity.topPages30d.map((p) => (
                  <li key={p.path} className="flex justify-between gap-4">
                    <span className="truncate">{p.path}</span>
                    <span className="text-gray-400 shrink-0">{p.count}×</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          <AnalyticsBarChart title="Verified hours by month" data={analytics.hoursByMonth} />
          <AnalyticsBarChart
            title="Applications by month"
            data={analytics.applicationsByMonth}
            colorClass="bg-indigo-500"
          />
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Application funnel</h2>
          <div className="grid sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.applicationsTotal}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{summary.applicationsAccepted}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{summary.applicationsCompleted}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{summary.applicationsRejected}</p>
              <p className="text-sm text-gray-500">Declined</p>
            </div>
          </div>
        </section>

        {managedOrgs.length > 0 && (
          <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Your organizations</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Coordinator analytics for each organization you manage.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {managedOrgs.map((org) => (
                <Link
                  key={org.id}
                  href={`/organizations/${org.id}/analytics`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{org.name}</span>
                  <span className="text-sm text-emerald-600">Org analytics →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {rollup && rollup.organizations.length > 1 && (
          <section className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-xl p-5">
            <h2 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Multi-org rollup</h2>
            <p className="text-sm text-indigo-800 dark:text-indigo-200 mb-4">
              Combined impact across {rollup.organizations.length} organizations you coordinate.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-indigo-900 dark:text-white">{rollup.totals.verifiedHours.toFixed(1)}h</p>
                <p className="text-sm text-indigo-700">Total verified hours</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-900 dark:text-white">
                  {formatImpactValue(rollup.totals.verifiedHours)}
                </p>
                <p className="text-sm text-indigo-700">Combined impact value</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-900 dark:text-white">{rollup.totals.activeVolunteers}</p>
                <p className="text-sm text-indigo-700">Active volunteers (30d)</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm">
              {rollup.organizations.map((o) => (
                <li key={o.id} className="flex justify-between text-indigo-900 dark:text-indigo-100">
                  <span>{o.name}</span>
                  <span>{o.verifiedHours.toFixed(1)}h · {formatImpactValue(o.verifiedHours)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Recent activity</h2>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500">No activity yet — join an event to start tracking.</p>
          ) : (
            <ul className="space-y-2">
              {analytics.recentActivity.map((item, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex justify-between gap-4">
                  <span>{item.label}</span>
                  <span className="text-gray-400 shrink-0">{item.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
