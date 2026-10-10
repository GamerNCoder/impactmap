import StarRating, { averageRating } from '@/components/StarRating'
import { formatDate } from '@/lib/constants'

export type VolunteerReview = {
  id: string
  rating: number
  review_text: string
  created_at: string | null
  organizations: { name: string } | null
  opportunities: { title: string } | null
  reviewer: { full_name: string | null } | null
}

type VolunteerReviewsListProps = {
  reviews: VolunteerReview[]
  showTitle?: boolean
}

export default function VolunteerReviewsList({ reviews, showTitle = true }: VolunteerReviewsListProps) {
  const avg = averageRating(reviews)

  if (reviews.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 text-center text-gray-600 text-sm">
        <p>No coordinator reviews yet.</p>
        <p className="mt-1 text-gray-500">Reviews appear after hosts verify your volunteer work.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showTitle && avg !== null && (
        <div className="flex flex-wrap items-center gap-3">
          <StarRating rating={avg} />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {avg} average · {reviews.length} review{reviews.length === 1 ? '' : 's'}
          </span>
        </div>
      )}
      {reviews.map((review) => (
        <article
          key={review.id}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-5 border-l-4 border-amber-400"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <StarRating rating={review.rating} size="sm" />
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {review.organizations?.name}
              </p>
              <p className="text-xs text-gray-500">{review.opportunities?.title}</p>
            </div>
            {review.created_at && (
              <time className="text-xs text-gray-400">{formatDate(review.created_at.split('T')[0])}</time>
            )}
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            &ldquo;{review.review_text}&rdquo;
          </p>
          {review.reviewer?.full_name && (
            <p className="text-xs text-gray-500 mt-2">— {review.reviewer.full_name}, coordinator</p>
          )}
        </article>
      ))}
    </div>
  )
}
