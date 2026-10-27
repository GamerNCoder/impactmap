import { createClient } from '@/lib/supabase/server'
import EventsExplorer from '@/components/EventsExplorer'
import Link from 'next/link'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'
import { getLocale } from '@/lib/locale'
import { getDictionary, localizeEvent, categoryLabel } from '@/lib/i18n'

export const metadata = {
  title: 'Events | ImpactMap',
  description: 'Discover and join volunteer events.',
}

type SearchParams = Promise<{ category?: string; q?: string; wheelchair?: string; substance?: string }>

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const t = getDictionary(await getLocale())
  const supabase = await createClient()

  let query = supabase
    .from('opportunities')
    .select('*, organizations(name, verified)')
    .eq('status', 'open')
    .order('start_date', { ascending: true, nullsFirst: false })

  if (params.category) query = query.eq('category', params.category)
  if (params.wheelchair === '1') query = query.eq('wheelchair_accessible', true)
  if (params.substance === '1') query = query.eq('substance_free', true)
  // Strip PostgREST filter syntax characters from free-text search.
  const q = params.q?.replace(/[,()*%\\]/g, ' ').trim()
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  const { data: opportunities, error } = await query

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">{t.events.badge}</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t.events.title}</h1>
              <p className="mt-2 text-gray-400">{t.events.intro}</p>
            </div>
            <Link href="/opportunities/new" className="bg-emerald-700 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              {t.events.host}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form method="GET" className="mb-6 flex flex-wrap gap-2 items-center">
          <label htmlFor="q" className="sr-only">{t.events.search}</label>
          <input id="q" name="q" type="search" defaultValue={params.q || ''} placeholder={t.events.search} className="flex-1 min-w-[160px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
          <label htmlFor="category" className="sr-only">{t.verify.category}</label>
          <select id="category" name="category" defaultValue={params.category || ''} className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            <option value="">{t.events.all}</option>
            {OPPORTUNITY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{categoryLabel(cat, t)}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 px-2">
            <input type="checkbox" name="wheelchair" value="1" defaultChecked={params.wheelchair === '1'} />
            {t.events.wheelchair}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 px-2">
            <input type="checkbox" name="substance" value="1" defaultChecked={params.substance === '1'} />
            {t.events.substance}
          </label>
          <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-800">{t.events.go}</button>
          {(params.q || params.category) && (
            <Link href="/opportunities" className="text-gray-500 px-2 py-2 text-sm">{t.events.clear}</Link>
          )}
        </form>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6">
            {t.events.unable}
          </div>
        )}

        {opportunities && opportunities.length > 0 ? (
          <EventsExplorer
            dict={t}
            events={opportunities.map((opp) => {
              const org = opp.organizations as { name: string; verified: boolean } | null
              const content = localizeEvent(opp, t)
              return {
                id: opp.id,
                title: content.title,
                category: opp.category,
                categoryLabel: categoryLabel(opp.category, t),
                location: content.location,
                remote: opp.remote ?? false,
                organizationName: org?.name ?? null,
                verified: Boolean(org?.verified),
                volunteersNeeded: opp.volunteers_needed,
                volunteersCount: opp.volunteers_count ?? 0,
                startDate: opp.start_date,
                latitude: opp.latitude,
                longitude: opp.longitude,
                wheelchairAccessible: Boolean(opp.wheelchair_accessible),
                accessibleRestroom: Boolean(opp.accessible_restroom),
                sensoryFriendly: Boolean(opp.sensory_friendly),
                substanceFree: Boolean(opp.substance_free),
              }
            })}
          />
        ) : (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400">{t.events.none}</p>
            <Link href="/opportunities/new" className="inline-block mt-4 text-emerald-700 font-semibold">{t.events.first} →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
