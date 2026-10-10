type EventLocationProps = {
  location: string | null | undefined
  remote?: boolean | null
  className?: string
}

/** Renders a physical address pin and/or a separate Online badge — never "Remote" as a place. */
export default function EventLocation({ location, remote, className = '' }: EventLocationProps) {
  const place = location?.trim()
  const isOnline = Boolean(remote)

  if (!place && !isOnline) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {isOnline && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Online
        </span>
      )}
      {place && (
        <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {place}
        </span>
      )}
    </div>
  )
}
