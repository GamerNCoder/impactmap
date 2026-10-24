import Link from 'next/link'
import EventLocation from '@/components/EventLocation'
import { formatDate } from '@/lib/constants'
import { getCategoryStyle } from '@/lib/categories'

type EventCardProps = {
  id: string
  title: string
  category: string
  location: string | null
  remote: boolean
  organizationName?: string | null
  volunteersNeeded?: number | null
  volunteersCount?: number
  startDate?: string | null
  verified?: boolean
  distanceMi?: number | null
  wheelchairAccessible?: boolean
  accessibleRestroom?: boolean
  sensoryFriendly?: boolean
  substanceFree?: boolean
}

export default function EventCard({
  id,
  title,
  category,
  location,
  remote,
  organizationName,
  volunteersNeeded,
  volunteersCount = 0,
  startDate,
  verified = false,
  distanceMi = null,
  wheelchairAccessible = false,
  accessibleRestroom = false,
  sensoryFriendly = false,
  substanceFree = false,
}: EventCardProps) {
  const cat = getCategoryStyle(category)
  const capacity = volunteersNeeded ?? 0
  const filled = volunteersCount
  const pct = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0
  const spotsLeft = capacity > 0 ? Math.max(0, capacity - filled) : null
  const isFull = spotsLeft === 0 && capacity > 0

  return (
    <article className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 motion-hover-lift flex flex-col">
      <div className={`h-1 ${cat.dot}`} />

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
            {category}
          </span>
          {distanceMi != null && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{distanceMi < 0.1 ? 'Here' : `${distanceMi.toFixed(1)} mi`}</span>
          )}
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
          {title}
        </h2>
        {(wheelchairAccessible || accessibleRestroom || sensoryFriendly || substanceFree) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {wheelchairAccessible && <span className="rounded-full bg-sky-50 text-sky-800 px-2 py-0.5 text-xs font-medium">Wheelchair accessible</span>}
            {accessibleRestroom && <span className="rounded-full bg-sky-50 text-sky-800 px-2 py-0.5 text-xs font-medium">Accessible restroom</span>}
            {sensoryFriendly && <span className="rounded-full bg-violet-50 text-violet-800 px-2 py-0.5 text-xs font-medium">Sensory-friendly</span>}
            {substanceFree && <span className="rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 text-xs font-medium">Alcohol- and smoke-free</span>}
          </div>
        )}

        {organizationName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {organizationName}
            {verified && (
              <span className="ml-1.5 inline-flex items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400" title="ImpactMap checked this organizer">
                ✓ Verified organizer
              </span>
            )}
          </p>
        )}

        {startDate && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
              <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(startDate)}
            </span>
          </div>
        )}

        <EventLocation location={location} remote={remote} className="mb-4" />

        {capacity > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">{filled} joined</span>
              <span className={isFull ? 'text-amber-700 dark:text-amber-400 font-medium' : 'text-gray-500'}>
                {isFull ? 'Full' : `${spotsLeft} spots left`}
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFull ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <Link
          href={`/opportunities/${id}`}
          className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-white motion-pressable"
        >
          {isFull ? 'View event' : 'Join event'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </article>
  )
}
