import { createClient } from '@/lib/supabase/server'
import OpportunityCard from '@/components/OpportunityCard'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'
import Link from 'next/link'

export const metadata = {
  title: 'Volunteer Opportunities | ImpactMap',
  description: 'Browse and apply to volunteer opportunities in your community.',
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

  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.remote === 'true') {
    query = query.eq('remote', true)
  }
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }

  const { data: opportunities, error } = await query

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">Volunteer Opportunities</h1>
          <p className="mt-2 text-gray-600">Find a cause you care about and start making an impact.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form method="GET" className="bg-white rounded-lg shadow-sm p-4 mb-8 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={params.q || ''}
              placeholder="Search opportunities..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category"
              name="category"
              defaultValue={params.category || ''}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">All categories</option>
              {OPPORTUNITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="remote" className="block text-sm font-medium text-gray-700 mb-1">Remote</label>
            <select
              id="remote"
              name="remote"
              defaultValue={params.remote || ''}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="">Any</option>
              <option value="true">Remote only</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
          >
            Filter
          </button>
          {(params.q || params.category || params.remote) && (
            <Link href="/opportunities" className="text-gray-500 hover:text-gray-700 py-2">
              Clear
            </Link>
          )}
        </form>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6">
            Unable to load opportunities. Make sure Supabase is configured and the schema is applied.
          </div>
        )}

        {opportunities && opportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                id={opp.id}
                title={opp.title}
                category={opp.category}
                location={opp.location}
                remote={opp.remote}
                organizationName={(opp.organizations as { name: string } | null)?.name}
                volunteersNeeded={opp.volunteers_needed}
                volunteersCount={opp.volunteers_count}
                deadline={opp.deadline}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No opportunities found.</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or check back soon.</p>
          </div>
        )}
      </div>
    </div>
  )
}
