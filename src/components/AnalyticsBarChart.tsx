'use client'

import { useEffect, useState } from 'react'

type AnalyticsBarChartProps = {
  title: string
  data: { month: string; value: number }[]
  valuePrefix?: string
  colorClass?: string
}

function formatMonth(key: string): string {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short' })
}

export default function AnalyticsBarChart({
  title,
  data,
  valuePrefix = '',
  colorClass = 'bg-emerald-500',
}: AnalyticsBarChartProps) {
  const [mounted, setMounted] = useState(false)
  const max = Math.max(...data.map((d) => d.value), 1)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 motion-fade-in-up">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      <div className="flex items-end gap-1.5 h-36">
        {data.map((point, index) => {
          const height = Math.max(4, Math.round((point.value / max) * 100))
          return (
            <div key={point.month} className="flex-1 flex flex-col items-center gap-1 min-w-0 group">
              <span className="text-[10px] text-gray-500 truncate w-full text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {point.value > 0 ? `${valuePrefix}${point.value}` : ''}
              </span>
              <div
                className={`w-full rounded-t ${colorClass} transition-colors duration-200 group-hover:brightness-110 ${
                  mounted ? 'motion-bar' : 'scale-y-0'
                }`}
                style={{
                  height: `${height}%`,
                  animationDelay: mounted ? `${index * 50}ms` : undefined,
                }}
                title={`${formatMonth(point.month)}: ${valuePrefix}${point.value}`}
              />
              <span className="text-[10px] text-gray-400">{formatMonth(point.month)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
