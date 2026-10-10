import { createClient } from '@/lib/supabase/server'
import { getPassedSkills } from '@/lib/competency-data'
import { getUserCommitmentScore } from '@/lib/commitment-data'
import { filterValidSkills } from '@/lib/skills'

export type AiUserContext = {
  firstName: string | null
  fullName: string | null
  skills: string[]
  verifiedSkills: string[]
  unverifiedSkills: string[]
  location: string | null
  bio: string | null
  preferredCategories: string[]
  commitmentScore: number
  commitmentLabel: string
  verifiedHours: number
  applicationCount: number
  completedEvents: number
  pastCategories: string[]
  idVerified: boolean
}

export async function getAiUserContext(userId: string): Promise<AiUserContext> {
  const supabase = await createClient()

  const [
    profileResult,
    verifiedSkills,
    commitment,
    applicationsResult,
    hoursResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, skills, location, bio, preferred_categories, id_verification_status')
      .eq('id', userId)
      .maybeSingle(),
    getPassedSkills(userId),
    getUserCommitmentScore(userId),
    supabase
      .from('applications')
      .select('status, opportunities(category)')
      .eq('user_id', userId),
    supabase
      .from('volunteer_hours')
      .select('hours')
      .eq('user_id', userId)
      .eq('verified', true),
  ])

  const profile = profileResult.data
  const skills = filterValidSkills(profile?.skills)
  const verifiedSet = new Set(verifiedSkills)
  const fullName = profile?.full_name?.trim() || null
  const firstName = fullName?.split(/\s+/)[0] ?? null

  const applications = applicationsResult.data ?? []
  const pastCategories = [
    ...new Set(
      applications
        .map((a) => {
          const opp = a.opportunities as unknown as { category: string } | null
          return opp?.category
        })
        .filter(Boolean) as string[]
    ),
  ]

  const verifiedHours = (hoursResult.data ?? []).reduce((sum, h) => sum + Number(h.hours), 0)

  return {
    firstName,
    fullName,
    skills,
    verifiedSkills,
    unverifiedSkills: skills.filter((s) => !verifiedSet.has(s)),
    location: profile?.location ?? null,
    bio: profile?.bio ?? null,
    preferredCategories: profile?.preferred_categories ?? [],
    commitmentScore: commitment.score,
    commitmentLabel: commitment.label,
    verifiedHours,
    applicationCount: applications.length,
    completedEvents: applications.filter((a) => a.status === 'completed').length,
    pastCategories,
    idVerified: profile?.id_verification_status === 'verified',
  }
}

export function formatAiUserContext(ctx: AiUserContext): string {
  const lines = [
    `Name: ${ctx.fullName ?? 'Volunteer'}${ctx.firstName ? ` (call them ${ctx.firstName})` : ''}`,
    ctx.location ? `Location: ${ctx.location}` : null,
    ctx.skills.length ? `Skills: ${ctx.skills.join(', ')}` : 'Skills: none listed',
    ctx.verifiedSkills.length
      ? `Competency-verified skills: ${ctx.verifiedSkills.join(', ')}`
      : null,
    ctx.unverifiedSkills.length
      ? `Skills not yet verified: ${ctx.unverifiedSkills.join(', ')}`
      : null,
    ctx.preferredCategories.length
      ? `Preferred causes: ${ctx.preferredCategories.join(', ')}`
      : null,
    ctx.pastCategories.length
      ? `Past event categories: ${ctx.pastCategories.join(', ')}`
      : null,
    `Commitment: ${ctx.commitmentLabel} (${ctx.commitmentScore}/100)`,
    `Verified hours: ${ctx.verifiedHours.toFixed(1)}`,
    `Applications: ${ctx.applicationCount}, completed events: ${ctx.completedEvents}`,
    ctx.idVerified ? 'ID verified: yes' : 'ID verified: no',
    ctx.bio ? `Bio: ${ctx.bio.slice(0, 200)}` : null,
  ].filter(Boolean)

  return lines.join('\n')
}

export function copilotSuggestions(ctx: AiUserContext): string[] {
  const suggestions: string[] = []

  if (ctx.applicationCount === 0) {
    suggestions.push('What event should I join first?')
  } else if (ctx.unverifiedSkills.length > 0) {
    suggestions.push(`Verify my ${ctx.unverifiedSkills[0]} skill`)
  } else {
    suggestions.push('What event fits me best?')
  }

  if (ctx.verifiedHours === 0) {
    suggestions.push('How do I log and verify hours?')
  } else {
    suggestions.push('Improve my Impact Passport')
  }

  if (!ctx.idVerified) {
    suggestions.push('Should I verify my ID?')
  } else {
    suggestions.push('Share my volunteer story')
  }

  return suggestions.slice(0, 3)
}

export function copilotGreeting(ctx: AiUserContext): string {
  const name = ctx.firstName ? `, ${ctx.firstName}` : ''
  if (ctx.applicationCount === 0) {
    return `Hey${name}! I'm Impact Copilot ✨ You have ${ctx.skills.length || 'no'} skills on your profile — ask me which events fit you, or how to verify skills and hours.`
  }
  if (ctx.unverifiedSkills.length > 0) {
    return `Hey${name}! You have ${ctx.unverifiedSkills.length} skill${ctx.unverifiedSkills.length === 1 ? '' : 's'} waiting to be verified — that can boost your matches. What do you want to tackle?`
  }
  return `Hey${name}! ${ctx.verifiedHours.toFixed(0)} verified hours, ${ctx.commitmentLabel.toLowerCase()} commitment — ask me about matches, your Passport, or hosting.`
}
