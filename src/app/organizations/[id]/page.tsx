import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OpportunityCard from '@/components/OpportunityCard'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('organizations').select('name').eq('id', id).single()
  return {
    title: data ? `${data.name} | ImpactMap` : 'Organization | ImpactMap',
  }
}

export default async function OrganizationDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !organization) {
    notFound()
  }

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*')
    .eq('organization_id', id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/organizations" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to organizations
        </Link>

        <div className="mt-6 bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            {organization.verified && (
              <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full shrink-0">
                Verified
              </span>
            )}
          </div>

          {organization.description && (
            <p className="mt-4 text-gray-700 whitespace-pre-wrap">{organization.description}</p>
          )}

          <dl className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
            {organization.location && (
              <div>
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-gray-900">{organization.location}</dd>
              </div>
            )}
            {organization.email && (
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">
                  <a href={`mailto:${organization.email}`} className="text-indigo-600 hover:underline">
                    {organization.email}
                  </a>
                </dd>
              </div>
            )}
            {organization.website && (
              <div>
                <dt className="text-gray-500">Website</dt>
                <dd className="font-medium">
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {organization.website}
                  </a>
                </dd>
              </div>
            )}
            {organization.phone && (
              <div>
                <dt className="text-gray-500">Phone</dt>
                <dd className="font-medium text-gray-900">{organization.phone}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open opportunities</h2>
          {opportunities && opportunities.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {opportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  id={opp.id}
                  title={opp.title}
                  category={opp.category}
                  location={opp.location}
                  remote={opp.remote}
                  organizationName={organization.name}
                  volunteersNeeded={opp.volunteers_needed}
                  volunteersCount={opp.volunteers_count}
                  deadline={opp.deadline}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-600 bg-white rounded-lg shadow-sm p-8 text-center">
              No open opportunities from this organization right now.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
