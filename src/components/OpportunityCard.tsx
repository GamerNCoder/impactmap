import Link from 'next/link'
import { formatDate } from '@/lib/constants'
import EventLocation from '@/components/EventLocation'

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
      <div className="text-sm text-emerald-700 font-medium mb-2">{category}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {organizationName && (
        <p className="text-gray-600 mb-4">{organizationName}</p>
      )}
      <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-4">
        <EventLocation location={location} remote={remote} />
        {deadline && (
          <span>Apply by {formatDate(deadline)}</span>
        )}
        {spotsLeft != null && (
          <span>{spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left</span>
        )}
      </div>
      <Link
        href={`/opportunities/${id}`}
        className="mt-auto text-emerald-700 font-medium hover:text-emerald-800"
      >
        View details →
      </Link>
    </article>
  )
}
