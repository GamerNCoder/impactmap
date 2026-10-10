import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/EventCard'
import Link from 'next/link'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'

export const metadata = {
  title: 'Events | ImpactMap',
  description: 'Discover and join volunteer events.',
}

type SearchParams = Promise<{ category?: string; remote?: string; q?: string }>

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('opportunities')
    .select('*, organizations(name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (params.category) query = query.eq('category', params.category)
  if (params.remote === 'true') query = query.eq('remote', true)
  if (params.q) query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)

  const { data: opportunities, error } = await query

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Events</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Find your next event</h1>
              <p className="mt-2 text-gray-400">Join in one click — capacity tracked in real time</p>
            </div>
            <Link href="/opportunities/new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              + Host an event
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form method="GET" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="q" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input id="q" name="q" type="search" defaultValue={params.q || ''} placeholder="Search events..." className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select id="category" name="category" defaultValue={params.category || ''} className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2">
              <option value="">All</option>
              {OPPORTUNITY_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="remote" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
            <select id="remote" name="remote" defaultValue={params.remote || ''} className="rounded-xl border border-gray-300 dark:border-gray-700 px-3 py-2">
              <option value="">All events</option>
              <option value="true">Online only</option>
            </select>
          </div>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700">Filter</button>
          {(params.q || params.category || params.remote) && (
            <Link href="/opportunities" className="text-gray-500 py-2 text-sm">Clear</Link>
          )}
        </form>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6">
            Unable to load events.
          </div>
        )}

        {opportunities && opportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <EventCard
                key={opp.id}
                id={opp.id}
                title={opp.title}
                category={opp.category}
                location={opp.location}
                remote={opp.remote}
                organizationName={(opp.organizations as { name: string } | null)?.name}
                volunteersNeeded={opp.volunteers_needed}
                volunteersCount={opp.volunteers_count}
                startDate={opp.start_date}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400">No events found.</p>
            <Link href="/opportunities/new" className="inline-block mt-4 text-emerald-600 font-semibold">Post the first one →</Link>
          </div>
        )}
      </div>
    </div>
  )
}
