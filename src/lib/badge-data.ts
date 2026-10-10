import { createClient } from '@/lib/supabase/server'
import { averageRating } from '@/components/StarRating'
import { computeEligibleBadges, getBadgeDefinition, type EarnedBadge } from '@/lib/badges'
import { getVolunteerReviews } from '@/lib/volunteer-reviews'
import { getPassedSkills } from '@/lib/competency-data'

export async function syncUserBadges(userId: string): Promise<EarnedBadge[]> {
  const supabase = await createClient()

  const [
    { data: profile },
    { count: appCount },
    { data: hours },
    { count: completedCount },
    reviews,
    { count: groupCount },
    { count: hostedCount },
    verifiedSkills,
  ] = await Promise.all([
    supabase.from('profiles').select('id_verification_status').eq('id', userId).single(),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('volunteer_hours').select('hours').eq('user_id', userId).eq('verified', true),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    getVolunteerReviews(userId),
    supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).eq('posted_by', userId),
    getPassedSkills(userId),
  ])

  const verifiedHours = (hours ?? []).reduce((s, h) => s + Number(h.hours), 0)
  const avg = averageRating(reviews)

  const eligible = computeEligibleBadges({
    idVerified: profile?.id_verification_status === 'verified',
    applicationCount: appCount ?? 0,
    verifiedHours,
    completedTasks: completedCount ?? 0,
    avgRating: avg,
    groupCount: groupCount ?? 0,
    hostedEvents: hostedCount ?? 0,
    verifiedSkillCount: verifiedSkills.length,
  })

  const now = new Date().toISOString()
  for (const key of eligible) {
    await supabase.from('user_badges').upsert(
      { user_id: userId, badge_key: key, earned_at: now },
      { onConflict: 'user_id,badge_key', ignoreDuplicates: true }
    )
  }

  const { data: earned } = await supabase
    .from('user_badges')
    .select('badge_key, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  return (earned ?? []).map((b) => ({ key: b.badge_key, earned_at: b.earned_at ?? now }))
}

export function badgesWithMeta(earned: EarnedBadge[]) {
  return earned
    .map((e) => ({ ...e, def: getBadgeDefinition(e.key) }))
    .filter((b) => b.def)
}
