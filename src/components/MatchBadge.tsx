import { getMatchLabel } from '@/lib/matching'

type MatchBadgeProps = {
  score: number
  size?: 'sm' | 'md'
}

export default function MatchBadge({ score, size = 'md' }: MatchBadgeProps) {
  const { label, className } = getMatchLabel(score)
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 font-medium rounded-full ${className} ${sizeClass}`}>
      <span className="font-bold">{score}%</span>
      <span>{label}</span>
    </span>
  )
}
