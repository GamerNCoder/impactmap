import { getBadgeDefinition } from '@/lib/badges'

type AchievementBadgesProps = {
  badges: { key: string; earned_at: string }[]
  size?: 'sm' | 'md'
}

export default function AchievementBadges({ badges, size = 'md' }: AchievementBadgesProps) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-gray-500">No achievement badges yet — volunteer, verify ID, and join groups to earn them.</p>
    )
  }

  const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const def = getBadgeDefinition(badge.key)
        if (!def) return null
        return (
          <span
            key={badge.key}
            title={def.description}
            className={`inline-flex items-center gap-1 rounded-full font-medium ${def.color} ${textSize}`}
          >
            <span aria-hidden>{def.icon}</span>
            {def.label}
          </span>
        )
      })}
    </div>
  )
}
