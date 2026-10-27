// Organizer dashboard summary for the "Approve hours" page.
//
// Everything here is derived from the queries the page already runs
// (pendingHours, verifiedHoursList, checkins). No placeholder numbers.
// No charting dependency — turnout bars are plain CSS.

type PendingHour = {
  id: string
  hours: number
  user_id: string
  opportunity_id: string
}

type VerifiedHour = {
  hours: number
  user_id: string
}

type Checkin = {
  user_id: string
  opportunity_id: string
}

type OrgStatsProps = {
  pendingHours: PendingHour[]
  verifiedHoursList: VerifiedHour[]
  checkins: Checkin[]
  totalVerified: number
  revokedCount?: number
  profileMap: Map<string, string | null>
  oppMap: Map<string, string | null>
}

const plural = (n: number, word: string, wordPlural?: string) =>
  `${n} ${n === 1 ? word : wordPlural ?? `${word}s`}`

export default function OrgStats({
  pendingHours,
  verifiedHoursList,
  checkins,
  totalVerified,
  revokedCount = 0,
  profileMap,
  oppMap,
}: OrgStatsProps) {
  const pendingTotal = pendingHours.reduce((sum, h) => sum + Number(h.hours), 0)
  const pendingStudents = new Set(pendingHours.map((h) => h.user_id)).size
  const approvedEntries = verifiedHoursList.length
  const approvedStudents = new Set(verifiedHoursList.map((h) => h.user_id)).size
  const turnoutStudents = new Set(checkins.map((c) => c.user_id)).size
  const turnoutEvents = new Set(checkins.map((c) => c.opportunity_id)).size

  const turnoutByEvent = [
    ...checkins.reduce((groups, row) => {
      groups.set(row.opportunity_id, (groups.get(row.opportunity_id) ?? 0) + 1)
      return groups
    }, new Map<string, number>()),
  ]
    .map(([opportunityId, count]) => ({ opportunityId, count }))
    .sort((a, b) => b.count - a.count)

  const maxTurnout = Math.max(1, ...turnoutByEvent.map((e) => e.count))

  const pendingPreview = pendingHours.slice(0, 4)
  const hiddenPending = pendingHours.length - pendingPreview.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Waiting for review</p>
          <p className={`mt-2 text-3xl font-bold ${pendingHours.length > 0 ? 'text-amber-600' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {pendingHours.length}
          </p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {pendingHours.length === 0
              ? 'Inbox zero — nothing waiting.'
              : `${pendingTotal.toFixed(1)}h from ${plural(pendingStudents, 'student')}`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hours approved</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-400">{totalVerified.toFixed(1)}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {approvedEntries === 0
              ? revokedCount > 0
                ? `${plural(revokedCount, 'revoked record')} excluded from totals.`
                : 'Approved hours will show here.'
              : `${plural(approvedEntries, 'entry', 'entries')} from ${plural(approvedStudents, 'student')}${revokedCount > 0 ? ` · ${plural(revokedCount, 'revoked record')} excluded` : ''}`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Check-ins</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-400">{checkins.length}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {checkins.length === 0
              ? 'No check-ins recorded yet.'
              : `${plural(turnoutStudents, 'student')} across ${plural(turnoutEvents, 'event')}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pending queue</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Hours students logged that still need your review.
          </p>
          {pendingHours.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nothing waiting. New hours appear here as students log them.
            </p>
          ) : (
            <>
              <ul className="space-y-3">
                {pendingPreview.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {profileMap.get(h.user_id) || 'Student'}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {' '}
                        · {oppMap.get(h.opportunity_id) || 'Event'}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold text-gray-900 dark:text-white">
                      {Number(h.hours)}h
                    </span>
                  </li>
                ))}
              </ul>
              {hiddenPending > 0 && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">+{hiddenPending} more below</p>
              )}
            </>
          )}
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Turnout by event</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Volunteers who checked in at each event.
          </p>
          {turnoutByEvent.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No check-ins yet. Turnout appears once volunteers scan an event&rsquo;s check-in QR.
            </p>
          ) : (
            <ul className="space-y-3">
              {turnoutByEvent.map(({ opportunityId, count }) => (
                <li key={opportunityId}>
                  <div className="flex items-center justify-between gap-3 text-sm mb-1">
                    <span className="truncate font-medium text-gray-900 dark:text-white">
                      {oppMap.get(opportunityId) || 'Event'}
                    </span>
                    <span className="shrink-0 text-gray-600 dark:text-gray-400">
                      {count} checked in
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400"
                      style={{ width: `${Math.round((count / maxTurnout) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
