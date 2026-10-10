import { createClient } from '@/lib/supabase/server'
import type { VolunteerReview } from '@/components/VolunteerReviewsList'

export async function getVolunteerReviews(volunteerId: string): Promise<VolunteerReview[]> {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('volunteer_reviews')
    .select(`
      id,
      rating,
      review_text,
      created_at,
      reviewer_id,
      organizations(name),
      opportunities(title)
    `)
    .eq('volunteer_id', volunteerId)
    .order('created_at', { ascending: false })

  if (!reviews?.length) return []

  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))]
  const { data: reviewers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', reviewerIds)

  const reviewerMap = new Map((reviewers ?? []).map((p) => [p.id, p.full_name]))

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    review_text: r.review_text,
    created_at: r.created_at,
    organizations: r.organizations as unknown as { name: string } | null,
    opportunities: r.opportunities as unknown as { title: string } | null,
    reviewer: { full_name: reviewerMap.get(r.reviewer_id) ?? null },
  }))
}

export type ReviewLookup = Map<string, { rating: number; review_text: string }>

export async function getOrgReviewLookup(orgId: string): Promise<ReviewLookup> {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('volunteer_reviews')
    .select('application_id, volunteer_hours_id, rating, review_text')
    .eq('organization_id', orgId)

  const map: ReviewLookup = new Map()
  for (const r of reviews ?? []) {
    const key = r.application_id ?? r.volunteer_hours_id
    if (key) map.set(key, { rating: r.rating, review_text: r.review_text })
  }
  return map
}
