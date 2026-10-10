import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import CommitmentBadge from '@/components/CommitmentBadge'
import { getUserCommitmentScore } from '@/lib/commitment-data'
import Link from 'next/link'
import VolunteerReviewsList from '@/components/VolunteerReviewsList'
import StarRating, { averageRating } from '@/components/StarRating'
import SharePassportButton from '@/components/SharePassportButton'
import IdVerificationForm from '@/components/IdVerificationForm'
import IdVerificationBadge from '@/components/IdVerificationBadge'
import { getVolunteerReviews } from '@/lib/volunteer-reviews'
import AchievementBadges from '@/components/AchievementBadges'
import { syncUserBadges } from '@/lib/badge-data'
import SkillVerificationPanel from '@/components/SkillVerificationPanel'
import { getUserCompetencyResults } from '@/lib/competency-data'

export const metadata = {
  title: 'Profile | ImpactMap',
  description: 'Manage your volunteer profile on ImpactMap.',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: verifiedSubmission } = await supabase
    .from('id_verification_submissions')
    .select('certificate_code, reviewed_at, legal_first_name, legal_last_name')
    .eq('user_id', user.id)
    .eq('status', 'verified')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: latestSubmission } = await supabase
    .from('id_verification_submissions')
    .select('rejection_reason')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const commitment = await getUserCommitmentScore(user.id)
  const reviews = await getVolunteerReviews(user.id)
  const avgReview = averageRating(reviews)
  const badges = await syncUserBadges(user.id)
  const competencyResults = await getUserCompetencyResults(user.id)

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your profile</h1>
              <p className="mt-2 text-gray-600">Help organizations get to know you.</p>
            </div>
            <CommitmentBadge commitment={commitment} />
            <IdVerificationBadge status={profile?.id_verification_status} />
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Link href="/passport" className="text-sm text-indigo-600 hover:underline">
              View Impact Passport →
            </Link>
            <SharePassportButton volunteerId={user.id} variant="light" />
          </div>
          {avgReview !== null && (
            <div className="flex items-center gap-2 mt-3">
              <StarRating rating={avgReview} size="sm" />
              <span className="text-sm text-gray-600">{avgReview} from {reviews.length} coordinator review{reviews.length === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Achievement badges</h2>
          <AchievementBadges badges={badges} />
        </section>

        <section className="bg-white rounded-lg shadow-sm p-8">
          <SkillVerificationPanel
            profileSkills={(profile?.skills as string[]) ?? []}
            results={competencyResults}
          />
        </section>

        <section className="bg-white rounded-lg shadow-sm p-8">
          <IdVerificationForm
            status={profile?.id_verification_status}
            profileFullName={profile?.full_name}
            certificateCode={profile?.id_certificate_code ?? verifiedSubmission?.certificate_code}
            legalName={
              verifiedSubmission
                ? `${verifiedSubmission.legal_first_name} ${verifiedSubmission.legal_last_name}`
                : profile?.full_name
            }
            verifiedAt={verifiedSubmission?.reviewed_at}
            rejectionReason={latestSubmission?.rejection_reason}
            skills={profile?.skills ?? undefined}
            preferredCategories={profile?.preferred_categories ?? undefined}
          />
        </section>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <ProfileForm profile={profile} userEmail={user.email || ''} />
        </div>

        {reviews.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What hosts say about you</h2>
            <VolunteerReviewsList reviews={reviews} />
          </section>
        )}
      </div>
    </div>
  )
}
