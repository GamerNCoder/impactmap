import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import StarRating, { averageRating } from '@/components/StarRating'
import VolunteerReviewsList from '@/components/VolunteerReviewsList'
import { formatDate } from '@/lib/constants'
import { formatImpactValue, summarizePassport, HOUR_VALUATION_USD } from '@/lib/impact-passport'
import { getVolunteerReviews } from '@/lib/volunteer-reviews'
import AchievementBadges from '@/components/AchievementBadges'
import { syncUserBadges } from '@/lib/badge-data'
import { getPublicPassedSkills } from '@/lib/competency-data'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', id).maybeSingle()
  return {
    title: profile?.full_name ? `${profile.full_name} | ImpactMap` : 'Volunteer Passport',
    description: 'Public volunteer credentials and coordinator reviews on ImpactMap.',
  }
}

export default async function PublicVolunteerPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, skills, location')
    .eq('id', id)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  const { data: verifiedHours } = await supabase
    .from('volunteer_hours')
    .select(`
      *,
      opportunities(title, category, organizations(name))
    `)
    .eq('user_id', id)
    .eq('verified', true)
    .order('verified_at', { ascending: false })

  const { data: verifiedCompletions } = await supabase
    .from('applications')
    .select(`
      *,
      opportunities(title, category, organizations(name))
    `)
    .eq('user_id', id)
    .eq('status', 'completed')
    .not('verification_code', 'is', null)
    .order('verified_at', { ascending: false })

  const reviews = await getVolunteerReviews(id)
  const summary = summarizePassport(verifiedHours ?? [], [])
  const totalCredentials = summary.credentialCount + (verifiedCompletions?.length ?? 0)
  const badges = await syncUserBadges(id)
  const verifiedSkills = await getPublicPassedSkills(id)
  const verifiedSet = new Set(verifiedSkills)


  const avg = averageRating(reviews)

  const { data: volunteerOpps } = await supabase
    .from('applications')
    .select('opportunities(organization_id)')
    .eq('user_id', id)
    .eq('status', 'completed')

  const { data: hourOpps } = await supabase
    .from('volunteer_hours')
    .select('opportunities(organization_id)')
    .eq('user_id', id)
    .eq('verified', true)

  const linkedOrgIds = [
    ...new Set(
      [...(volunteerOpps ?? []), ...(hourOpps ?? [])]
        .map((row) => {
          const opp = row.opportunities as unknown as { organization_id: string } | null
          return opp?.organization_id
        })
        .filter(Boolean) as string[]
    ),
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TrackOnce
        event={APP_EVENTS.PUBLIC_PASSPORT_VIEW}
        resourceType="volunteer"
        resourceId={id}
        metadata={{ volunteer_orgs: linkedOrgIds }}
      />
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide">Public Impact Passport</p>
              <h1 className="text-3xl font-bold mt-2">{profile.full_name}</h1>
              {profile.location && (
                <p className="text-indigo-100 mt-1">{profile.location}</p>
              )}
              {avg !== null && (
                <div className="flex items-center gap-2 mt-3">
                  <StarRating rating={avg} />
                  <span className="text-sm text-indigo-100">{avg} · {reviews.length} reviews</span>
                </div>
              )}
            </div>
            <Logo size="sm" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-5">
            <p className="text-sm text-gray-500">Verified hours</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{summary.totalVerifiedHours.toFixed(1)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-5">
            <p className="text-sm text-gray-500">Impact value</p>
            <p className="text-3xl font-bold text-indigo-600">{formatImpactValue(summary.totalVerifiedHours)}</p>
            <p className="text-xs text-gray-400 mt-1">@${HOUR_VALUATION_USD}/hr</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-5">
            <p className="text-sm text-gray-500">Credentials</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalCredentials}</p>
          </div>
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Achievement badges</h2>
          <AchievementBadges badges={badges} />
        </section>

        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {(profile.skills as string[]).map((skill: string) => {
                const isVerified = verifiedSet.has(skill)
                return (
                  <span
                    key={skill}
                    className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full ${
                      isVerified
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}
                    title={isVerified ? 'Competency verified' : undefined}
                  >
                    {isVerified && (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                    {skill}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Coordinator reviews</h2>
          <VolunteerReviewsList reviews={reviews} showTitle={false} />
        </section>

        {(verifiedHours?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Verified service hours</h2>
            <div className="space-y-3">
              {verifiedHours!.map((entry) => {
                const opp = entry.opportunities as {
                  title: string
                  category: string
                  organizations: { name: string } | null
                } | null
                return (
                  <article key={entry.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{opp?.title}</p>
                        <p className="text-sm text-gray-600">{opp?.organizations?.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {entry.hours}h · {formatDate(entry.date)}
                        </p>
                      </div>
                      {entry.verification_code && (
                        <Link href={`/verify/${entry.verification_code}`} className="font-mono text-sm text-indigo-600 hover:underline">
                          {entry.verification_code}
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {(verifiedCompletions?.length ?? 0) > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Verified completions</h2>
            <div className="space-y-3">
              {verifiedCompletions!.map((entry) => {
                const opp = entry.opportunities as {
                  title: string
                  organizations: { name: string } | null
                } | null
                return (
                  <article key={entry.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 border-l-4 border-emerald-500">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{opp?.title}</p>
                        <p className="text-sm text-gray-600">{opp?.organizations?.name}</p>
                      </div>
                      {entry.verification_code && (
                        <Link href={`/verify/${entry.verification_code}`} className="font-mono text-sm text-emerald-600 hover:underline">
                          {entry.verification_code}
                        </Link>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        <p className="text-center text-sm text-gray-500 pb-8">
          Verified on{' '}
          <Link href="/" className="text-emerald-600 hover:underline">ImpactMap</Link>
        </p>
      </div>
    </div>
  )
}
