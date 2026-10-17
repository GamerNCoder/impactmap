// Approved hours over time, rendered as a hand-rolled SVG bar chart.
//
// No charting dependency: this keeps the bundle small for a student project.
// Data comes only from verifiedHoursList (verified_at preferred, falling back
// to the logged date). Renders an honest empty state when there is nothing
// approved yet.

type VerifiedHour = {
  hours: number
  date: string
  verified_at: string | null
}

type MonthBucket = {
  year: number
  month: number
  hours: number
  count: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function groupByMonth(rows: VerifiedHour[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>()
  for (const row of rows) {
    const iso = row.verified_at ?? row.date
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) continue
    const year = parsed.getUTCFullYear()
    const month = parsed.getUTCMonth()
    const key = `${year}-${month}`
    const entry = map.get(key) ?? { year, month, hours: 0, count: 0 }
    entry.hours += Number(row.hours)
    entry.count += 1
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => a.year - b.year || a.month - b.month)
}

function TrendChart({ months }: { months: MonthBucket[] }) {
  const max = Math.max(...months.map((m) => m.hours), 1)
  const barWidth = 26
  const gap = 16
  const step = barWidth + gap
  const padX = 8
  const chartTop = 8
  const chartHeight = 100
  const baseline = chartTop + chartHeight
  const width = padX * 2 + months.length * step - gap
  const height = baseline + 26
  const spansYears = new Set(months.map((m) => m.year)).size > 1

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-40"
      role="img"
      aria-label={`Approved hours by month: ${months
        .map((m) => `${MONTH_LABELS[m.month]} ${m.year}, ${m.hours.toFixed(1)} hours`)
        .join('; ')}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={0}
        y1={baseline}
        x2={width}
        y2={baseline}
        className="stroke-gray-200 dark:stroke-gray-700"
        strokeWidth={1}
      />
      {months.map((m, i) => {
        const barHeight = Math.max(2, (m.hours / max) * chartHeight)
        const x = padX + i * step
        const y = baseline - barHeight
        const label = spansYears
          ? `${MONTH_LABELS[m.month]} ’${String(m.year).slice(2)}`
          : MONTH_LABELS[m.month]
        return (
          <g key={`${m.year}-${m.month}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={4}
              className="fill-emerald-500 dark:fill-emerald-400"
            >
              <title>{`${MONTH_LABELS[m.month]} ${m.year}: ${m.hours.toFixed(1)}h from ${m.count} ${
                m.count === 1 ? 'entry' : 'entries'
              }`}</title>
            </rect>
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-500 dark:fill-gray-400"
              fontSize={10}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function HoursTrend({ verifiedHoursList }: { verifiedHoursList: VerifiedHour[] }) {
  const months = groupByMonth(verifiedHoursList)
  const totalHours = months.reduce((sum, m) => sum + m.hours, 0)

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Approved hours over time</h2>
      {months.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nothing approved yet. Once you approve hours, this chart tracks them by month.
        </p>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {totalHours.toFixed(1)}h approved across {months.length} {months.length === 1 ? 'month' : 'months'}.
          </p>
          <TrendChart months={months} />
        </>
      )}
    </section>
  )
}
