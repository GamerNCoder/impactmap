import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CommitmentBadge from '@/components/CommitmentBadge'
import { formatDate } from '@/lib/constants'
import {
  formatImpactValue,
  summarizePassport,
  HOUR_VALUATION_USD,
} from '@/lib/impact-passport'
import { getUserCommitmentScore } from '@/lib/commitment-data'
import SharePassportButton from '@/components/SharePassportButton'
import PassportQrCard from '@/components/PassportQrCard'
import IdVerificationBadge from '@/components/IdVerificationBadge'
import IdVerificationCertificate from '@/components/IdVerificationCertificate'
import VolunteerReviewsList from '@/components/VolunteerReviewsList'
import StarRating, { averageRating } from '@/components/StarRating'
import { getVolunteerReviews } from '@/lib/volunteer-reviews'
import AchievementBadges from '@/components/AchievementBadges'
import AiImpactStory from '@/components/AiImpactStory'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'
import { syncUserBadges } from '@/lib/badge-data'

export const metadata = {
  title: 'Impact Passport | ImpactMap',
  description: 'Your verified volunteer credentials and impact record.',
}

export default async function PassportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/passport')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, id_verification_status, id_certificate_code, skills')
    .eq('id', user.id)
    .single()

  const { data: verifiedHours } = await supabase
    .from('volunteer_hours')
    .select(`
      *,
      opportunities(title, category, organizations(name))
    `)
    .eq('user_id', user.id)
    .eq('verified', true)
    .order('verified_at', { ascending: false })

  const { data: pendingHours } = await supabase
    .from('volunteer_hours')
    .select(`
      *,
      opportunities(title)
    `)
    .eq('user_id', user.id)
    .eq('verified', false)
    .order('created_at', { ascending: false })

  const { data: verifiedCompletions } = await supabase
    .from('applications')
    .select(`
      *,
      opportunities(title, category, organizations(name))
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .not('verification_code', 'is', null)
    .order('verified_at', { ascending: false })

  const commitment = await getUserCommitmentScore(user.id)
  const summary = summarizePassport(verifiedHours ?? [], pendingHours ?? [])
  const totalCredentials = summary.credentialCount + (verifiedCompletions?.length ?? 0)
  const reviews = await getVolunteerReviews(user.id)
  const avgReview = averageRating(reviews)
  const badges = await syncUserBadges(user.id)

  const { data: idCertificate } = profile?.id_certificate_code
    ? await supabase
        .from('id_verification_submissions')
        .select('legal_first_name, legal_last_name, reviewed_at, certificate_code')
        .eq('certificate_code', profile.id_certificate_code)
        .maybeSingle()
    : { data: null }

  return (
    <div className="bg-gray-50 min-h-full">
      <TrackOnce event={APP_EVENTS.PASSPORT_VIEW} />
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide">Impact Passport</p>
          <h1 className="text-3xl font-bold mt-2">{profile?.full_name || 'Volunteer'}</h1>
          <p className="text-indigo-100 mt-1">{profile?.email}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CommitmentBadge commitment={commitment} />
            {avgReview !== null && (
              <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                <StarRating rating={avgReview} size="sm" />
                <span className="text-sm text-indigo-100">{avgReview} · {reviews.length} reviews</span>
              </div>
            )}
            <SharePassportButton volunteerId={user.id} />
            <PassportQrCard volunteerId={user.id} volunteerName={profile?.full_name ?? undefined} />
            <IdVerificationBadge status={profile?.id_verification_status} size="sm" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-sm text-gray-500">Verified hours</p>
            <p className="text-3xl font-bold text-gray-900">{summary.totalVerifiedHours.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-sm text-gray-500">Community impact value</p>
            <p className="text-3xl font-bold text-indigo-600">{formatImpactValue(summary.totalVerifiedHours)}</p>
            <p className="text-xs text-gray-400 mt-1">@${HOUR_VALUATION_USD}/hr valuation</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-sm text-gray-500">Credentials issued</p>
            <p className="text-3xl font-bold text-gray-900">{totalCredentials}</p>
          </div>
        </div>

        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Achievement badges</h2>
          <AchievementBadges badges={badges} />
        </section>

        {summary.totalVerifiedHours > 0 && (
          <section className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Share your impact</h2>
            <AiImpactStory
              name={profile?.full_name ?? undefined}
              hours={summary.totalVerifiedHours}
              skills={profile?.skills ?? undefined}
              eventCount={totalCredentials}
            />
          </section>
        )}

        {commitment.factors.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-2">Commitment Score factors</h2>
            <ul className="text-sm text-gray-600 space-y-1">
              {commitment.factors.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        )}

        {profile?.id_certificate_code && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Identity verification certificate</h2>
            <IdVerificationCertificate
              certificateCode={profile.id_certificate_code}
              legalName={
                idCertificate
                  ? `${idCertificate.legal_first_name} ${idCertificate.legal_last_name}`
                  : profile.full_name ?? undefined
              }
              verifiedAt={idCertificate?.reviewed_at}
            />
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Coordinator reviews</h2>
          <p className="text-sm text-gray-500 mb-4">
            Written by hosts after they verify your work.{' '}
            <Link href={`/volunteers/${user.id}`} className="text-indigo-600 hover:underline" target="_blank">
              View public passport →
            </Link>
          </p>
          <VolunteerReviewsList reviews={reviews} showTitle={avgReview !== null} />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verified service hours</h2>
          {verifiedHours && verifiedHours.length > 0 ? (
            <div className="space-y-4">
              {verifiedHours.map((entry) => {
                const opp = entry.opportunities as {
                  title: string
                  category: string
                  organizations: { name: string } | null
                } | null
                return (
                  <article key={entry.id} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-green-500">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{opp?.title}</p>
                        <p className="text-sm text-gray-600">{opp?.organizations?.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {entry.hours}h · {formatDate(entry.date)} · {opp?.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-indigo-600">{entry.verification_code}</p>
                        <Link
                          href={`/verify/${entry.verification_code}`}
                          className="text-xs text-indigo-600 hover:underline"
                          target="_blank"
                        >
                          Public verify link →
                        </Link>
                      </div>
                    </div>
                    {entry.supervisor_name && (
                      <p className="text-xs text-gray-500 mt-2">
                        Attested by {entry.supervisor_name}
                        {entry.supervisor_title && `, ${entry.supervisor_title}`}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-600">
              <p>No verified credentials yet.</p>
              <p className="text-sm mt-2">
                Log hours from an accepted role, then ask your organization coordinator to verify them.
              </p>
              <Link href="/dashboard" className="inline-block mt-4 text-indigo-600 font-medium hover:underline">
                Go to dashboard →
              </Link>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Verified task completions</h2>
          {verifiedCompletions && verifiedCompletions.length > 0 ? (
            <div className="space-y-4">
              {verifiedCompletions.map((entry) => {
                const opp = entry.opportunities as {
                  title: string
                  category: string
                  organizations: { name: string } | null
                } | null
                return (
                  <article key={entry.id} className="bg-white rounded-lg shadow-sm p-5 border-l-4 border-emerald-500">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Task completed</p>
                        <p className="font-medium text-gray-900">{opp?.title}</p>
                        <p className="text-sm text-gray-600">{opp?.organizations?.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {entry.completed_at ? formatDate(entry.completed_at.split('T')[0]) : '—'} · {opp?.category}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold text-emerald-600">{entry.verification_code}</p>
                        <Link
                          href={`/verify/${entry.verification_code}`}
                          className="text-xs text-emerald-600 hover:underline"
                          target="_blank"
                        >
                          Public verify link →
                        </Link>
                      </div>
                    </div>
                    {entry.supervisor_name && (
                      <p className="text-xs text-gray-500 mt-2">
                        Attested by {entry.supervisor_name}
                        {entry.supervisor_title && `, ${entry.supervisor_title}`}
                      </p>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-600 text-sm">
              <p>Completed events verified by coordinators appear here with public IMP- codes.</p>
            </div>
          )}
        </section>

        {pendingHours && pendingHours.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending verification ({summary.totalPendingHours.toFixed(1)}h)
            </h2>
            <div className="space-y-3">
              {pendingHours.map((entry) => {
                const opp = entry.opportunities as { title: string } | null
                return (
                  <div key={entry.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-400">
                    <p className="font-medium text-gray-900">{opp?.title}</p>
                    <p className="text-sm text-gray-600">
                      {entry.hours}h on {formatDate(entry.date)} — awaiting coordinator verification
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
