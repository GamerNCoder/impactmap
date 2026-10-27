import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ImpactMapView, { type ImpactPoint } from '@/components/ImpactMapView'
import { getLocale } from '@/lib/locale'
import { getDictionary, categoryLabel } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Community impact | ImpactMap',
  description:
    'Verified student service hours by cause, organization and neighborhood — aggregated with no student identities.',
}

type CategoryRow = { category: string; hours: number; records: number }
type OrganizationRow = { organization: string; hours: number; records: number }
type MonthRow = { month: string; hours: number; records: number }

type Summary = {
  totals: {
    hours: number
    records: number
    students: number | null
    events: number
    organizations: number
  }
  by_category: CategoryRow[]
  by_organization: OrganizationRow[]
  by_month: MonthRow[]
  map: Array<ImpactPoint & { hours: number }>
}

const EMPTY: Summary = {
  totals: { hours: 0, records: 0, students: 0, events: 0, organizations: 0 },
  by_category: [],
  by_organization: [],
  by_month: [],
  map: [],
}

function monthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export default async function ImpactPage() {
  const t = getDictionary(await getLocale())
  const supabase = await createClient()

  const [{ data: raw }, { data: openEvents }] = await Promise.all([
    supabase.rpc('impact_summary'),
    supabase.from('opportunities').select('category').eq('status', 'open'),
  ])

  const summary = ((raw as unknown as Summary | null) ?? EMPTY)
  const totals = summary.totals ?? EMPTY.totals
  const byCategory = summary.by_category ?? []
  const byOrganization = summary.by_organization ?? []
  const byMonth = summary.by_month ?? []
  const mapPoints = (summary.map ?? []).map((point) => ({
    ...point,
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    hours: Number(point.hours),
  }))

  const categoriesWithEvents = new Set((openEvents ?? []).map((event) => event.category))
  const categoriesWithHours = new Set(byCategory.map((row) => row.category))
  const gaps = [...categoriesWithEvents].filter((category) => !categoriesWithHours.has(category))

  const maxCategoryHours = Math.max(...byCategory.map((row) => Number(row.hours)), 1)
  const maxMonthHours = Math.max(...byMonth.map((row) => Number(row.hours)), 1)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <section className="bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
            Community impact
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
            Service hours, mapped by what they changed.
          </h1>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl leading-relaxed">
            Every number here comes from an organizer-approved hour log. No student names, contact
            details or birthdays are shown — just the verified work and where it happened.
          </p>

          <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <dt className="text-sm text-gray-400">Verified hours</dt>
              <dd className="mt-1 text-3xl font-bold text-emerald-300">
                {Number(totals.hours).toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </dd>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <dt className="text-sm text-gray-400">Students</dt>
                            <dd className="mt-1 text-3xl font-bold">
                {totals.students == null ? '—' : Number(totals.students).toLocaleString('en-US')}
              </dd>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <dt className="text-sm text-gray-400">Events</dt>
              <dd className="mt-1 text-3xl font-bold">{Number(totals.events).toLocaleString('en-US')}</dd>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <dt className="text-sm text-gray-400">Organizations</dt>
              <dd className="mt-1 text-3xl font-bold">{Number(totals.organizations).toLocaleString('en-US')}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Where the hours happened</h2>
              <p className="text-sm text-gray-500 mt-1">
                Circle size is verified hours at that event. The map is public; the people are not.
              </p>
            </div>
            <Link href="/opportunities" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
              Find an event →
            </Link>
          </div>
          <ImpactMapView points={mapPoints} />
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hours by cause</h2>
            <p className="text-sm text-gray-500 mt-1">Approved hours grouped by event category.</p>
            {byCategory.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">
                No group has 3 or more distinct volunteers yet. Smaller groups are suppressed to protect privacy.
              </p>
            ) : (
              <ul className="mt-6 space-y-4">
                {byCategory.map((row) => (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{categoryLabel(row.category, t)}</span>
                      <span className="text-gray-500">
                        {Number(row.hours).toLocaleString('en-US', { maximumFractionDigits: 1 })}h
                        <span className="text-gray-500"> · {row.records} log{row.records === 1 ? '' : 's'}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${Math.max(4, (Number(row.hours) / maxCategoryHours) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {gaps.length > 0 && (
              <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-4">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Causes still waiting for hours</p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                  These have open events but no publishable hours yet — either none have been
                  approved, or fewer than three distinct volunteers have logged them: {gaps.map((c) => categoryLabel(c, t)).join(', ')}.
                </p>
              </div>
            )}
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hours by month</h2>
            <p className="text-sm text-gray-500 mt-1">Approved hours over time.</p>
            {byMonth.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">No group has 3 or more distinct volunteers yet.</p>
            ) : (
              <ul className="mt-6 flex items-end gap-3 h-40" aria-label="Verified hours by month">
                {byMonth.map((row) => (
                  <li key={row.month} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                    <span className="text-xs text-gray-500">{Number(row.hours)}h</span>
                    <div
                      className="w-full rounded-t-lg bg-emerald-600 min-h-[4px]"
                      style={{ height: `${Math.max(4, (Number(row.hours) / maxMonthHours) * 100)}%` }}
                      title={`${monthLabel(row.month)}: ${row.hours} verified hours`}
                    />
                    <span className="text-[11px] text-gray-500 whitespace-nowrap">{monthLabel(row.month)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organizations behind the hours</h2>
          <p className="text-sm text-gray-500 mt-1">Only organizer-approved logs are counted.</p>
          {byOrganization.length === 0 ? (
            <p className="mt-6 text-sm text-gray-500">No organization has 3 or more distinct volunteers yet.</p>
          ) : (
            <ul className="mt-6 divide-y divide-gray-100 dark:divide-gray-800">
              {byOrganization.map((row) => (
                <li key={row.organization} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <span className="font-medium text-gray-900 dark:text-white">{row.organization}</span>
                  <span className="text-sm text-gray-500">
                    {Number(row.hours).toLocaleString('en-US', { maximumFractionDigits: 1 })}h
                    <span className="text-gray-500"> · {row.records} log{row.records === 1 ? '' : 's'}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Add to the map</h2>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              Post an event, approve the hours, and the impact shows up here. Students never need an
              account to check a code.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/opportunities" className="rounded-xl bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-800">
              Find an event
            </Link>
            <Link href="/opportunities/new" className="rounded-xl border border-emerald-700 text-emerald-800 dark:text-emerald-300 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40">
              Host an event
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Aggregates only. ImpactMap never publishes a student&rsquo;s name alongside their hours on
          this page, and the public record shows only what an organizer approved. While the shared
          demo records exist, they are included in these totals.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Privacy threshold: groups with fewer than 3 distinct volunteers are suppressed, and a total
          student count below 5 is shown as &ldquo;&mdash;&rdquo;. Hours and record totals remain public.
        </p>
      </div>
    </div>
  )
}
