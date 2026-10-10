import { createClient } from '@/lib/supabase/server'
import { profileCompleteness, rankOpportunities } from '@/lib/matching'
import { getPassedSkills } from '@/lib/competency-data'

export async function getVolunteerMatches(userId: string, limit?: number) {
  const supabase = await createClient()

  const [profileResult, verifiedSkills] = await Promise.all([
    supabase
      .from('profiles')
      .select('skills, location, bio')
      .eq('id', userId)
      .maybeSingle(),
    getPassedSkills(userId),
  ])

  const profile = profileResult.data

  const volunteerProfile = {
    skills: profile?.skills ?? null,
    location: profile?.location ?? null,
    bio: profile?.bio ?? null,
    verifiedSkills,
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('opportunity_id, opportunities(category)')
    .eq('user_id', userId)

  const appliedIds = (applications ?? []).map((a) => a.opportunity_id)
  const pastCategories = [
    ...new Set(
      (applications ?? [])
        .map((a) => {
          const opp = a.opportunities as unknown as { category: string } | null
          return opp?.category
        })
        .filter(Boolean) as string[]
    ),
  ]

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select('*, organizations(name)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  const ranked = rankOpportunities(
    volunteerProfile,
    opportunities ?? [],
    appliedIds,
    pastCategories
  )

  const completeness = profileCompleteness(volunteerProfile)

  return {
    profile: volunteerProfile,
    ranked: limit ? ranked.slice(0, limit) : ranked,
    totalMatches: ranked.length,
    appliedCount: appliedIds.length,
    completeness,
  }
}
