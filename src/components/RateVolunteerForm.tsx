'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import StarRating from '@/components/StarRating'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type RateVolunteerFormProps = {
  volunteerId: string
  volunteerName: string
  organizationId: string
  opportunityId: string
  opportunityTitle: string
  applicationId?: string
  volunteerHoursId?: string
  existingRating?: number
  existingReview?: string
}

export default function RateVolunteerForm({
  volunteerId,
  volunteerName,
  organizationId,
  opportunityId,
  opportunityTitle,
  applicationId,
  volunteerHoursId,
  existingRating,
  existingReview,
}: RateVolunteerFormProps) {
  const [rating, setRating] = useState(existingRating ?? 0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState(existingReview ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(Boolean(existingRating && existingReview))
  const router = useRouter()
  const supabase = createClient()
  const isEdit = Boolean(existingRating)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating < 1) {
      setError('Please select a star rating.')
      return
    }
    if (reviewText.trim().length < 10) {
      setError('Please write at least 10 characters about this volunteer.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in')

      const payload = {
        volunteer_id: volunteerId,
        reviewer_id: user.id,
        organization_id: organizationId,
        opportunity_id: opportunityId,
        application_id: applicationId ?? null,
        volunteer_hours_id: volunteerHoursId ?? null,
        rating,
        review_text: reviewText.trim(),
      }

      if (isEdit && (applicationId || volunteerHoursId)) {
        let query = supabase.from('volunteer_reviews').update({
          rating,
          review_text: reviewText.trim(),
        })
        if (applicationId) query = query.eq('application_id', applicationId)
        else if (volunteerHoursId) query = query.eq('volunteer_hours_id', volunteerHoursId)
        const { error: updateError } = await query
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('volunteer_reviews').insert(payload)
        if (insertError) throw insertError
      }

      trackClientEvent(APP_EVENTS.REVIEW_SUBMIT, {
        organizationId,
        resourceType: 'volunteer',
        resourceId: volunteerId,
      })

      setSaved(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save review')
    } finally {
      setLoading(false)
    }
  }

  if (saved && !isEdit) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm">
        <p className="font-medium text-amber-900 dark:text-amber-100">
          Review saved for {volunteerName}
        </p>
        <div className="mt-1">
          <StarRating rating={rating} size="sm" />
        </div>
        <p className="text-amber-800 dark:text-amber-200 mt-2 italic">&ldquo;{reviewText}&rdquo;</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-amber-200 dark:border-amber-900 rounded-lg p-4 space-y-3 bg-amber-50/50 dark:bg-amber-950/30">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {isEdit ? 'Update review' : 'Rate'} {volunteerName}
        </p>
        <p className="text-xs text-gray-500">{opportunityTitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Rating *</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-amber-400"
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <svg
                className={`w-7 h-7 ${star <= (hover || rating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Write about this volunteer *
        </label>
        <textarea
          required
          minLength={10}
          rows={3}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="What did they do well? Would you recommend them?"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Saving…' : isEdit ? 'Update review' : 'Publish review'}
      </button>
    </form>
  )
}
