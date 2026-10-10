/** Fixed volunteer skill options — choice-only, used in onboarding and profile. */
export const VOLUNTEER_SKILLS = [
  'Communication',
  'Leadership',
  'Teaching',
  'Writing',
  'Social media',
  'Organization',
  'Customer service',
  'Physical stamina',
  'Outdoor work',
  'Data entry',
  'Photography',
  'Cooking',
  'First aid',
  'Mentoring',
  'Teamwork',
  'Spanish',
  'Fundraising',
  'Design',
  'Coding',
  'Patience',
] as const

export type VolunteerSkill = (typeof VOLUNTEER_SKILLS)[number]

export const MIN_SKILLS_REQUIRED = 1

export function filterValidSkills(skills: string[] | null | undefined): VolunteerSkill[] {
  if (!skills?.length) return []
  const allowed = new Set<string>(VOLUNTEER_SKILLS)
  return skills.filter((s): s is VolunteerSkill => allowed.has(s))
}
