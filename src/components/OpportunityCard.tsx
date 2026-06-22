import Link from 'next/link'
import { formatDate } from '@/lib/constants'

type OpportunityCardProps = {
  id: string
  title: string
  category: string
  location: string | null
  remote: boolean
  organizationName?: string | null
  volunteersNeeded?: number | null
  volunteersCount?: number
  deadline?: string | null
}

export default function OpportunityCard({
  id,
  title,
  category,
  location,
  remote,
  organizationName,
  volunteersNeeded,
  volunteersCount = 0,
  deadline,
}: OpportunityCardProps) {
  const spotsLeft =
    volunteersNeeded != null ? Math.max(0, volunteersNeeded - volunteersCount) : null

  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col">
      <div className="text-sm text-indigo-600 font-medium mb-2">{category}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {organizationName && (
        <p className="text-gray-600 mb-4">{organizationName}</p>
      )}
      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {remote ? 'Remote' : location || 'On-site'}
        </span>
        {deadline && (
          <span>Apply by {formatDate(deadline)}</span>
        )}
        {spotsLeft != null && (
          <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
        )}
      </div>
      <Link
        href={`/opportunities/${id}`}
        className="mt-auto text-indigo-600 font-medium hover:text-indigo-800"
      >
        View details →
      </Link>
    </article>
  )
}
