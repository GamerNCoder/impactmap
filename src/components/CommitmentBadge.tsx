import { getCommitmentStyles, type CommitmentResult } from '@/lib/commitment-score'

type CommitmentBadgeProps = {
  commitment: CommitmentResult
  showScore?: boolean
  size?: 'sm' | 'md'
}

export default function CommitmentBadge({
  commitment,
  showScore = true,
  size = 'md',
}: CommitmentBadgeProps) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${getCommitmentStyles(commitment.tier)} ${sizeClass}`}
      title={commitment.factors.join(' · ')}
    >
      {showScore && commitment.score > 0 && (
        <span className="font-bold">{commitment.score}</span>
      )}
      <span>{commitment.label}</span>
    </span>
  )
}
