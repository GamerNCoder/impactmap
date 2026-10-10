'use client'

import { useState } from 'react'
import { requestAi } from '@/lib/ai-client'
import AiBadge from '@/components/AiBadge'

type AiMatchInsightProps = {
  title: string
  category: string
  score: number
  matchedSkills: string[]
  missingSkills?: string[]
  location?: string | null
}

export default function AiMatchInsight(props: AiMatchInsightProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [source, setSource] = useState<string>('impactmap')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (insight) return
    setLoading(true)
    setError(null)
    try {
      const { text, source: s } = await requestAi('match-insight', { ...props })
      setInsight(text)
      setSource(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load insight')
    } finally {
      setLoading(false)
    }
  }

  if (!insight && !loading) {
    return (
      <button
        type="button"
        onClick={load}
        className="mt-3 w-full text-left text-xs px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/60 transition-colors"
      >
        ✨ Why this match fits you
      </button>
    )
  }

  if (loading) {
    return (
      <p className="mt-3 text-xs text-violet-600 dark:text-violet-400 animate-pulse px-1">
        Analyzing your fit…
      </p>
    )
  }

  if (error) {
    return <p className="mt-3 text-xs text-red-600">{error}</p>
  }

  return (
    <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-100 dark:border-violet-900">
      <div className="mb-1">
        <AiBadge source={source} />
      </div>
      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{insight}</p>
    </div>
  )
}
