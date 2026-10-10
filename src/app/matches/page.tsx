import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MatchedOpportunityCard from '@/components/MatchedOpportunityCard'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'
import { getVolunteerMatches } from '@/lib/matching-data'
import { getUserCompetencyResults } from '@/lib/competency-data'

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

  const { data: profile } = await supabase.from('profiles').select('skills').eq('id', user.id).single()
  if (!profile?.skills?.length) {
    redirect('/onboarding')
  }

  const { ranked, completeness, appliedCount } = await getVolunteerMatches(user.id)
  const competencyResults = await getUserCompetencyResults(user.id)
  const verifiedSet = new Set(competencyResults.filter((r) => r.passed).map((r) => r.skill_key))
  const unverifiedSkillCount = ((profile.skills ?? []) as string[]).filter((s) => !verifiedSet.has(s)).length
  const strongMatches = ranked.filter((r) => r.match.score >= 60)
  const otherMatches = ranked.filter((r) => r.match.score < 60)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <TrackOnce event={APP_EVENTS.MATCHES_VIEW} />
      <div className="bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">
            SkillMatch · ✨ AI-powered
          </p>
          <h1 className="text-3xl md:text-4xl font-bold">Roles ranked for you</h1>
          <p className="mt-3 text-gray-400 max-w-2xl">
            Every open event scored against your skills and location. Tap ✨ on any match for a personalized AI insight on why you&apos;ll thrive there.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {unverifiedSkillCount > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                {unverifiedSkillCount} skill{unverifiedSkillCount !== 1 ? 's' : ''} not yet verified
              </p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
                Take a quick competency test to boost your match score and show hosts you mean it.
              </p>
            </div>
            <Link
              href="/skills/verify"
              className="shrink-0 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              Verify skills
            </Link>
          </div>
        )}

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
