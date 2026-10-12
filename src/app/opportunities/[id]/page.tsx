import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JoinEventButton from '@/components/JoinEventButton'
import EventCheckInQr from '@/components/EventCheckInQr'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'
import { formatDate } from '@/lib/constants'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('opportunities').select('title').eq('id', id).single()
  return {
    title: data ? `${data.title} | ImpactMap` : 'Opportunity | ImpactMap',
  }
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*, organizations(*)')
    .eq('id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  const org = opportunity.organizations as {
    id: string
    name: string
    description: string | null
    website: string | null
    verified: boolean
  } | null

  const { data: { user } } = await supabase.auth.getUser()

  let existingApplication = null
  let isHost = false
  if (user) {
    isHost = opportunity.posted_by === user.id

    const { data } = await supabase
      .from('applications')
      .select('status')
      .eq('opportunity_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    existingApplication = data
  }

  const isJoined = existingApplication?.status === 'accepted' || existingApplication?.status === 'pending'
  const isFull =
    opportunity.volunteers_needed != null &&
    opportunity.volunteers_count >= opportunity.volunteers_needed

  return (
    <div className="bg-gray-50 min-h-full">
      <TrackOnce
        event={APP_EVENTS.OPPORTUNITY_VIEW}
        organizationId={org?.id}
        resourceType="opportunity"
        resourceId={id}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/opportunities" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to opportunities
        </Link>

        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-indigo-100 text-indigo-700 text-sm font-medium px-3 py-1 rounded-full">
                  {opportunity.category}
                </span>
                {opportunity.remote && (
                  <span className="bg-violet-100 text-violet-800 text-sm font-medium px-3 py-1 rounded-full">
                    Online
                  </span>
                )}
                <span className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full capitalize">
                  {opportunity.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{opportunity.title}</h1>

              {org && (
                <Link
                  href={`/organizations/${org.id}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {org.name}
                </Link>
              )}
              {org?.verified && (
                <span className="ml-2 text-xs font-semibold text-emerald-700" title="ImpactMap checked this organizer">✓ Verified organizer</span>
              )}

              <div className="mt-6 prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{opportunity.description}</p>
              </div>

              {opportunity.requirements && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{opportunity.requirements}</p>
                </div>
              )}

              {opportunity.benefits && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Benefits</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{opportunity.benefits}</p>
                </div>
              )}

              {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills_required.map((skill: string) => (
                      <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
              <dl className="space-y-3 text-sm">
                {opportunity.location?.trim() && (
                  <div>
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900">{opportunity.location}</dd>
                  </div>
                )}
                {opportunity.remote && (
                  <div>
                    <dt className="text-gray-500">Format</dt>
                    <dd className="font-medium text-gray-900">Online event</dd>
                  </div>
                )}
                {opportunity.time_commitment && (
                  <div>
                    <dt className="text-gray-500">Time commitment</dt>
                    <dd className="font-medium text-gray-900">{opportunity.time_commitment}</dd>
                  </div>
                )}
                {opportunity.start_date && (
                  <div>
                    <dt className="text-gray-500">Start date</dt>
                    <dd className="font-medium text-gray-900">{formatDate(opportunity.start_date)}</dd>
                  </div>
                )}
                {opportunity.deadline && (
                  <div>
                    <dt className="text-gray-500">Apply by</dt>
                    <dd className="font-medium text-gray-900">{formatDate(opportunity.deadline)}</dd>
                  </div>
                )}
                {opportunity.volunteers_needed != null && (
                  <div>
                    <dt className="text-gray-500">Volunteers needed</dt>
                    <dd className="font-medium text-gray-900">
                      {opportunity.volunteers_count} / {opportunity.volunteers_needed} filled
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Join this event</h2>
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Sign in to join this event.</p>
                  <Link
                    href={`/auth/login?next=/opportunities/${id}`}
                    className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Sign in to join
                  </Link>
                </div>
              ) : (
                <>
                  <JoinEventButton
                    opportunityId={id}
                    opportunityTitle={opportunity.title}
                    organizationId={opportunity.organization_id}
                    isJoined={isJoined}
                    isFull={isFull}
                    isOpen={opportunity.status === 'open'}
                    isHost={isHost}
                  />
                  {existingApplication && existingApplication.status === 'rejected' && (
                    <p className="mt-3 text-sm text-red-600">Your previous sign-up was not accepted.</p>
                  )}
                </>
              )}
            </div>

            <EventCheckInQr opportunityId={id} title={opportunity.title} />
          </div>
        </div>
      </div>
    </div>
  )
}
