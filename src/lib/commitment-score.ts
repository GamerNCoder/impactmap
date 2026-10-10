export type ApplicationRecord = {
  status: string
  no_show: boolean | null
  completed_at: string | null
}

export type HourRecord = {
  verified: boolean
  hours: number
}

export type CommitmentResult = {
  score: number
  label: string
  tier: 'new' | 'building' | 'reliable' | 'trusted' | 'exemplary'
  factors: string[]
}

export function getCommitmentTier(score: number): CommitmentResult['tier'] {
  if (score === 0) return 'new'
  if (score < 40) return 'building'
  if (score < 65) return 'reliable'
  if (score < 85) return 'trusted'
  return 'exemplary'
}

export function getCommitmentLabel(tier: CommitmentResult['tier']): string {
  switch (tier) {
    case 'new':
      return 'New volunteer'
    case 'building':
      return 'Building track record'
    case 'reliable':
      return 'Reliable'
    case 'trusted':
      return 'Trusted'
    case 'exemplary':
      return 'Exemplary'
  }
}

export function getCommitmentStyles(tier: CommitmentResult['tier']): string {
  switch (tier) {
    case 'new':
      return 'bg-gray-100 text-gray-700'
    case 'building':
      return 'bg-amber-100 text-amber-800'
    case 'reliable':
      return 'bg-blue-100 text-blue-800'
    case 'trusted':
      return 'bg-indigo-100 text-indigo-800'
    case 'exemplary':
      return 'bg-green-100 text-green-800'
  }
}

export function computeCommitmentScore(
  applications: ApplicationRecord[],
  hours: HourRecord[]
): CommitmentResult {
  const factors: string[] = []
  const totalApps = applications.length
  const accepted = applications.filter((a) =>
    ['accepted', 'completed'].includes(a.status)
  ).length
  const completed = applications.filter(
    (a) => a.status === 'completed' || a.completed_at
  ).length
  const noShows = applications.filter((a) => a.no_show).length

  const totalHours = hours.reduce((s, h) => s + Number(h.hours), 0)
  const verifiedHours = hours
    .filter((h) => h.verified)
    .reduce((s, h) => s + Number(h.hours), 0)

  if (totalApps === 0 && totalHours === 0) {
    return {
      score: 0,
      label: 'New volunteer',
      tier: 'new',
      factors: ['Log hours and complete a shift to build your Commitment Score'],
    }
  }

  let score = 35

  if (accepted > 0) {
    const bonus = Math.min(20, accepted * 6)
    score += bonus
    factors.push(`${accepted} accepted role${accepted !== 1 ? 's' : ''}`)
  }

  if (completed > 0) {
    const bonus = Math.min(25, completed * 10)
    score += bonus
    factors.push(`${completed} completed placement${completed !== 1 ? 's' : ''}`)
  }

  if (noShows > 0) {
    score -= noShows * 12
    factors.push(`${noShows} no-show${noShows !== 1 ? 's' : ''} (penalty)`)
  }

  if (totalHours > 0) {
    const verifyRate = verifiedHours / totalHours
    score += Math.round(verifyRate * 25)
    if (verifiedHours > 0) {
      factors.push(`${verifiedHours.toFixed(1)} verified hours`)
    } else {
      factors.push('Get hours verified to boost your score')
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const tier = getCommitmentTier(score)

  return {
    score,
    label: getCommitmentLabel(tier),
    tier,
    factors,
  }
}
