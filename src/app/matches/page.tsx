import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MatchedOpportunityCard from '@/components/MatchedOpportunityCard'
import { getVolunteerMatches } from '@/lib/matching-data'

export const metadata = {
  title: 'Your Matches | ImpactMap',
  description: 'Volunteer roles ranked by how well they fit your skills and location.',
}

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/matches')
  }

  const { ranked, completeness, appliedCount } = await getVolunteerMatches(user.id)
  const strongMatches = ranked.filter((r) => r.match.score >= 60)
  const otherMatches = ranked.filter((r) => r.match.score < 60)

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide mb-2">
            SkillMatch
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">Roles matched to you</h1>
          <p className="mt-3 text-indigo-100 max-w-2xl">
            Stop applying everywhere. We rank open opportunities by your skills, location,
            and past volunteer interests — so nonprofits get qualified applicants and you
            find roles where you&apos;ll actually make an impact.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {completeness.percent < 100 && (
          <div className="bg-white border border-indigo-100 rounded-lg p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                Profile {completeness.percent}% complete — better data, better matches
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Still needed: {completeness.missing.join(' · ')}
              </p>
            </div>
            <Link
              href="/profile"
              className="shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Complete profile
            </Link>
          </div>
        )}

        {appliedCount > 0 && (
          <p className="text-sm text-gray-500 mb-6">
            Hiding {appliedCount} role{appliedCount !== 1 ? 's' : ''} you&apos;ve already applied to.
          </p>
        )}

        {strongMatches.length > 0 ? (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top matches ({strongMatches.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {strongMatches.map((item, index) => {
                const org = item.opportunity.organizations as { name: string } | null
                return (
                  <MatchedOpportunityCard
                    key={item.opportunity.id}
                    rank={index + 1}
                    id={item.opportunity.id}
                    title={item.opportunity.title}
                    category={item.opportunity.category}
                    location={item.opportunity.location}
                    remote={item.opportunity.remote}
                    organizationName={org?.name}
                    volunteersNeeded={item.opportunity.volunteers_needed}
                    volunteersCount={item.opportunity.volunteers_count}
                    deadline={item.opportunity.deadline}
                    match={item.match}
                  />
                )
              })}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center mb-12">
            <h2 className="text-xl font-semibold text-gray-900">No strong matches yet</h2>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              Add skills and location to your profile so we can rank opportunities for you.
            </p>
            <Link
              href="/profile"
              className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              Update profile
            </Link>
          </div>
        )}

        {otherMatches.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Other open roles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherMatches.map((item) => {
                const org = item.opportunity.organizations as { name: string } | null
                return (
                  <MatchedOpportunityCard
                    key={item.opportunity.id}
                    id={item.opportunity.id}
                    title={item.opportunity.title}
                    category={item.opportunity.category}
                    location={item.opportunity.location}
                    remote={item.opportunity.remote}
                    organizationName={org?.name}
                    volunteersNeeded={item.opportunity.volunteers_needed}
                    volunteersCount={item.opportunity.volunteers_count}
                    deadline={item.opportunity.deadline}
                    match={item.match}
                  />
                )
              })}
            </div>
          </>
        )}

        {ranked.length === 0 && (
          <p className="text-center text-gray-500 py-12">
            No open opportunities right now.{' '}
            <Link href="/opportunities" className="text-indigo-600 hover:underline">
              Browse all roles
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
