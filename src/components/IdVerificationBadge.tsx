import type { IdVerificationStatus } from '@/lib/id-verification'
import { idStatusLabel } from '@/lib/id-verification'

type IdVerificationBadgeProps = {
  status: IdVerificationStatus | string | null
  size?: 'sm' | 'md'
}

const styles: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  pending: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800',
  unverified: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
}

export default function IdVerificationBadge({ status, size = 'md' }: IdVerificationBadgeProps) {
  const key = status ?? 'unverified'
  const className = styles[key] ?? styles.unverified
  const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${className} ${textSize}`}>
      {key === 'verified' && (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )}
      {idStatusLabel(key)}
    </span>
  )
}
