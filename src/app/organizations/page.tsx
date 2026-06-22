import { createClient } from '@/lib/supabase/server'
import OrganizationCard from '@/components/OrganizationCard'

export const metadata = {
  title: 'Organizations | ImpactMap',
  description: 'Discover nonprofits and community organizations on ImpactMap.',
}

export default async function OrganizationsPage() {
  const supabase = await createClient()

  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')

  const { data: opportunityCounts } = await supabase
    .from('opportunities')
    .select('organization_id')
    .eq('status', 'open')

  const countMap = (opportunityCounts || []).reduce<Record<string, number>>((acc, row) => {
    acc[row.organization_id] = (acc[row.organization_id] || 0) + 1
    return acc
  }, {})

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-2 text-gray-600">Partner with trusted nonprofits making a difference.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6">
            Unable to load organizations. Make sure Supabase is configured and the schema is applied.
          </div>
        )}

        {organizations && organizations.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <OrganizationCard
                key={org.id}
                id={org.id}
                name={org.name}
                description={org.description}
                location={org.location}
                verified={org.verified}
                opportunityCount={countMap[org.id] || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg">No organizations yet.</p>
            <p className="text-gray-500 mt-2">Check back soon as new partners join ImpactMap.</p>
          </div>
        )}
      </div>
    </div>
  )
}
