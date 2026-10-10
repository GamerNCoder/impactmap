export type BadgeDefinition = {
  key: string
  label: string
  description: string
  icon: string
  color: string
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: 'id_verified', label: 'ID Verified', description: 'Government ID confirmed by ImpactMap', icon: '🛡️', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  { key: 'first_event', label: 'First Sign-up', description: 'Joined your first volunteer event', icon: '🎯', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { key: 'hours_10', label: '10 Hours', description: '10 verified volunteer hours', icon: '⏱️', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { key: 'hours_50', label: '50 Hours', description: '50 verified volunteer hours', icon: '🏅', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { key: 'task_complete', label: 'Task Finisher', description: 'Completed and verified an event', icon: '✅', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
  { key: 'top_rated', label: 'Top Rated', description: 'Average 4.5+ stars from coordinators', icon: '⭐', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
  { key: 'community_builder', label: 'Community Builder', description: 'Joined a volunteer group', icon: '👥', color: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300' },
  { key: 'host', label: 'Event Host', description: 'Posted a volunteer event', icon: '📣', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
  { key: 'skill_proven', label: 'Skills Proven', description: 'Passed competency tests for 3+ skills', icon: '🎓', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' },
]

export function getBadgeDefinition(key: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.key === key)
}

export type EarnedBadge = {
  key: string
  earned_at: string
}

export type BadgeEligibilityInput = {
  idVerified: boolean
  applicationCount: number
  verifiedHours: number
  completedTasks: number
  avgRating: number | null
  groupCount: number
  hostedEvents: number
  verifiedSkillCount: number
}

export function computeEligibleBadges(input: BadgeEligibilityInput): string[] {
  const keys: string[] = []
  if (input.idVerified) keys.push('id_verified')
  if (input.applicationCount > 0) keys.push('first_event')
  if (input.verifiedHours >= 10) keys.push('hours_10')
  if (input.verifiedHours >= 50) keys.push('hours_50')
  if (input.completedTasks > 0) keys.push('task_complete')
  if (input.avgRating !== null && input.avgRating >= 4.5) keys.push('top_rated')
  if (input.groupCount > 0) keys.push('community_builder')
  if (input.hostedEvents > 0) keys.push('host')
  if (input.verifiedSkillCount >= 3) keys.push('skill_proven')
  return keys
}
