import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import AnalyticsBarChart from '@/components/AnalyticsBarChart'
import EngagementBadge from '@/components/EngagementBadge'
import OrgPlanBadge from '@/components/OrgPlanBadge'
import OrgValuationSettings from '@/components/OrgValuationSettings'
import OrgEnterpriseSettings from '@/components/OrgEnterpriseSettings'
import { getOrgAnalytics } from '@/lib/org-analytics-data'
import { canManageOrg } from '@/lib/org-access'
import { getOrgPlanContext } from '@/lib/org-plan-data'
import { planLimits, planLabel } from '@/lib/plan-tiers'

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const analytics = await getOrgAnalytics(id)
  return {
    title: analytics ? `${analytics.organizationName} Analytics | ImpactMap` : 'Organization Analytics',
  }
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export default async function OrganizationAnalyticsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/organizations/${id}/analytics`)

  if (!(await canManageOrg(id, user.id))) {
    redirect(`/organizations/${id}/manage`)
  }

  const analytics = await getOrgAnalytics(id)
  if (!analytics) notFound()

  const plan = await getOrgPlanContext(id)
  const limits = planLimits(analytics.planTier)
  const { summary } = analytics

  const { data: org } = await supabase
    .from('organizations')
    .select('hour_valuation_usd, verified')
    .eq('id', id)
    .single()

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href={`/organizations/${id}/manage`} className="text-indigo-600 text-sm hover:underline">
            ← Coordinator dashboard
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4 mt-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.organizationName} analytics</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Volunteer engagement, churn risk, and impact reporting at ${analytics.hourValuationUsd}/hr.
              </p>
            </div>
            {plan && <OrgPlanBadge planTier={plan.planTier} verified={plan.verified} />}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href={`/api/org/${id}/export`}
              className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Download CSV report
            </a>
            {limits.esgExport && (
              <a
                href={`/api/org/${id}/export/esg`}
                className="text-sm px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              >
                ESG / CSR export
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Verified hours', value: summary.totalVerifiedHours.toFixed(1) },
            { label: 'Impact value', value: formatUsd(summary.totalImpactValueUsd) },
            { label: 'Active volunteers (30d)', value: String(summary.activeVolunteers) },
            { label: 'At-risk volunteers', value: String(summary.atRiskVolunteers) },
            { label: 'Churned volunteers', value: String(summary.churnedVolunteers) },
            { label: 'Open events', value: String(summary.openEvents) },
            { label: 'Pending applications', value: String(summary.pendingApplications) },
            { label: 'Coordinator seats', value: `${summary.coordinatorSeatsUsed}/${summary.coordinatorSeatLimit}` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Program activity (30 days)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.dashboardViews30d}</p>
              <p className="text-gray-500">Dashboard visits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.analyticsViews30d}</p>
              <p className="text-gray-500">Analytics views</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.exports30d}</p>
              <p className="text-gray-500">Report exports</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.coordinatorActions30d}</p>
              <p className="text-gray-500">Coordinator actions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.applicationsReceived30d}</p>
              <p className="text-gray-500">Applications received</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.publicPassportViews30d}</p>
              <p className="text-gray-500">Public passport views</p>
            </div>
            {limits.apiAccess && (
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activity.apiCalls30d}</p>
                <p className="text-gray-500">API requests</p>
              </div>
            )}
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          <AnalyticsBarChart title="Verified hours by month" data={analytics.hoursByMonth} />
          <AnalyticsBarChart
            title="Applications by month"
            data={analytics.applicationsByMonth}
            colorClass="bg-violet-500"
          />
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Volunteer engagement &amp; churn</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Active = activity in last 30 days · At risk = 31–90 days · Churned = 90+ days without activity
          </p>
          {analytics.volunteerEngagement.length === 0 ? (
            <p className="text-sm text-gray-500">No volunteer activity recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-2 pr-4">Volunteer</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Hours</th>
                    <th className="pb-2 pr-4">Applications</th>
                    <th className="pb-2">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.volunteerEngagement.map((v) => (
                    <tr key={v.userId} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{v.name}</td>
                      <td className="py-2 pr-4"><EngagementBadge status={v.status} /></td>
                      <td className="py-2 pr-4">{v.totalHours.toFixed(1)}</td>
                      <td className="py-2 pr-4">{v.applications}</td>
                      <td className="py-2 text-gray-500">{v.lastActivityDate ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top events by impact</h2>
          <ul className="space-y-3">
            {analytics.topEvents.map((e) => (
              <li key={e.title} className="flex justify-between gap-4 text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{e.title}</span>
                <span className="text-gray-500">{e.verifiedHours.toFixed(1)}h · {e.applications} apps</span>
              </li>
            ))}
          </ul>
        </section>

        {limits.customValuation && plan && (
          <OrgValuationSettings
            organizationId={id}
            currentRate={org?.hour_valuation_usd}
            defaultRate={analytics.hourValuationUsd}
            planTier={plan.planTier}
          />
        )}

        {limits.apiAccess && plan && (
          <OrgEnterpriseSettings organizationId={id} planTier={plan.planTier} />
        )}

        {analytics.planTier === 'starter' && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-5">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">Upgrade for more</h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              {planLabel('growth')} unlocks verified org badge, up to 10 coordinator seats, and custom impact valuation.
              Enterprise adds ESG exports, API access, webhooks, and multi-org rollup.
            </p>
            <a
              href="mailto:sales@impactmap.app?subject=Upgrade%20plan"
              className="inline-block mt-3 text-sm font-medium text-amber-900 dark:text-amber-100 underline"
            >
              Contact sales to upgrade
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
