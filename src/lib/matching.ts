export type VolunteerProfile = {
  skills: string[] | null
  location: string | null
  bio: string | null
}

export type OpportunityForMatch = {
  id: string
  category: string
  skills_required: string[] | null
  location: string | null
  remote: boolean
}

export type MatchResult = {
  score: number
  reasons: string[]
  matchedSkills: string[]
  missingSkills: string[]
}

function normalize(value: string): string {
  return value.toLowerCase().trim()
}

function skillMatches(userSkill: string, requiredSkill: string): boolean {
  const user = normalize(userSkill)
  const required = normalize(requiredSkill)
  return user.includes(required) || required.includes(user)
}

function skillsScore(
  userSkills: string[],
  required: string[] | null
): { score: number; matched: string[]; missing: string[] } {
  if (!required?.length) {
    return { score: 65, matched: [], missing: [] }
  }
  if (!userSkills.length) {
    return { score: 15, matched: [], missing: required }
  }

  const matched = required.filter((req) =>
    userSkills.some((skill) => skillMatches(skill, req))
  )
  const missing = required.filter((req) => !matched.includes(req))
  const ratio = matched.length / required.length

  return {
    score: Math.round(ratio * 100),
    matched,
    missing,
  }
}

function locationScore(
  userLocation: string | null,
  oppLocation: string | null,
  remote: boolean
): number {
  if (remote) return 100
  if (!userLocation || !oppLocation) return 45

  const user = normalize(userLocation)
  const opp = normalize(oppLocation)

  if (opp.includes(user) || user.includes(opp)) return 100

  const userWords = user.split(/[\s,]+/).filter((w) => w.length > 2)
  const oppWords = opp.split(/[\s,]+/).filter((w) => w.length > 2)
  const hasOverlap = userWords.some((w) =>
    oppWords.some((ow) => ow.includes(w) || w.includes(ow))
  )

  return hasOverlap ? 75 : 25
}

export function computeMatch(
  profile: VolunteerProfile,
  opportunity: OpportunityForMatch,
  pastCategories: string[] = []
): MatchResult {
  const userSkills = profile.skills ?? []
  const skills = skillsScore(userSkills, opportunity.skills_required)
  const location = locationScore(profile.location, opportunity.location, opportunity.remote)

  const categoryAffinity = pastCategories.includes(opportunity.category) ? 100 : 50

  let score = Math.round(
    skills.score * 0.55 + location * 0.3 + categoryAffinity * 0.15
  )

  if (skills.matched.length > 0 && skills.score >= 50) {
    score = Math.min(100, score + 5)
  }

  const reasons: string[] = []

  if (skills.matched.length > 0) {
    reasons.push(
      `${skills.matched.length}/${opportunity.skills_required?.length ?? skills.matched.length} required skills: ${skills.matched.join(', ')}`
    )
  } else if (opportunity.skills_required?.length && !userSkills.length) {
    reasons.push('Add skills to your profile to improve match accuracy')
  }

  if (opportunity.remote) {
    reasons.push('Work remotely — no commute needed')
  } else if (location >= 75) {
    reasons.push('Location aligns with your area')
  } else if (profile.location && !opportunity.remote) {
    reasons.push('May require travel from your location')
  }

  if (pastCategories.includes(opportunity.category)) {
    reasons.push(`You have experience in ${opportunity.category}`)
  }

  if (skills.missing.length > 0 && userSkills.length > 0) {
    reasons.push(`Gap: ${skills.missing.join(', ')}`)
  }

  return {
    score,
    reasons,
    matchedSkills: skills.matched,
    missingSkills: skills.missing,
  }
}

export function getMatchLabel(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Excellent fit', className: 'bg-green-100 text-green-800' }
  if (score >= 60) return { label: 'Good fit', className: 'bg-indigo-100 text-indigo-800' }
  if (score >= 40) return { label: 'Partial fit', className: 'bg-amber-100 text-amber-800' }
  return { label: 'Low fit', className: 'bg-gray-100 text-gray-600' }
}

export function profileCompleteness(profile: VolunteerProfile): {
  percent: number
  missing: string[]
} {
  const checks = [
    { field: 'skills', ok: (profile.skills?.length ?? 0) > 0, label: 'Add your skills' },
    { field: 'location', ok: !!profile.location, label: 'Add your location' },
    { field: 'bio', ok: !!profile.bio, label: 'Write a short bio' },
  ]
  const done = checks.filter((c) => c.ok).length
  const missing = checks.filter((c) => !c.ok).map((c) => c.label)

  return {
    percent: Math.round((done / checks.length) * 100),
    missing,
  }
}

export type RankedMatch<T extends OpportunityForMatch> = {
  opportunity: T
  match: MatchResult
}

export function rankOpportunities<T extends OpportunityForMatch>(
  profile: VolunteerProfile,
  opportunities: T[],
  excludeIds: string[] = [],
  pastCategories: string[] = []
): RankedMatch<T>[] {
  return opportunities
    .filter((o) => !excludeIds.includes(o.id))
    .map((opportunity) => ({
      opportunity,
      match: computeMatch(profile, opportunity, pastCategories),
    }))
    .sort((a, b) => b.match.score - a.match.score)
}
