import { createClient } from '@/lib/supabase/server'
import EventsExplorer from '@/components/EventsExplorer'
import Link from 'next/link'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'

export const metadata = {
  title: 'Events | ImpactMap',
  description: 'Discover and join volunteer events.',
}

type SearchParams = Promise<{ category?: string; q?: string }>

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('opportunities')
    .select('*, organizations(name, verified)')
    .eq('status', 'open')
    .order('start_date', { ascending: true, nullsFirst: false })

  if (params.category) query = query.eq('category', params.category)
  // Strip PostgREST filter syntax characters from free-text search.
  const q = params.q?.replace(/[,()*%\\]/g, ' ').trim()
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)

  const { data: opportunities, error } = await query

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Events</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Find your next event</h1>
              <p className="mt-2 text-gray-400">Pick an event on the map, join in one tap, and get your hours verified.</p>
            </div>
            <Link href="/opportunities/new" className="bg-emerald-700 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              + Host an event
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <form method="GET" className="mb-6 flex flex-wrap gap-2 items-center">
          <label htmlFor="q" className="sr-only">Search events</label>
          <input id="q" name="q" type="search" defaultValue={params.q || ''} placeholder="Search events" className="flex-1 min-w-[160px] rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2" />
          <label htmlFor="category" className="sr-only">Category</label>
          <select id="category" name="category" defaultValue={params.category || ''} className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2">
            <option value="">All causes</option>
            {OPPORTUNITY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-800">Go</button>
          {(params.q || params.category) && (
            <Link href="/opportunities" className="text-gray-500 px-2 py-2 text-sm">Clear</Link>
          )}
        </form>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6">
            Unable to load events.
          </div>
        )}

        {opportunities && opportunities.length > 0 ? (
          <EventsExplorer
            events={opportunities.map((opp) => {
              const org = opp.organizations as { name: string; verified: boolean } | null
              return {
                id: opp.id,
                title: opp.title,
                category: opp.category,
                location: opp.location,
                remote: opp.remote ?? false,
                organizationName: org?.name ?? null,
                verified: Boolean(org?.verified),
                volunteersNeeded: opp.volunteers_needed,
                volunteersCount: opp.volunteers_count ?? 0,
                startDate: opp.start_date,
                latitude: opp.latitude,
                longitude: opp.longitude,
              }
            })}
          />
        ) : (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400">No events found.</p>
            <Link href="/opportunities/new" className="inline-block mt-4 text-emerald-700 font-semibold">Post the first one →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
