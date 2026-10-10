'use client'

import { useState } from 'react'
import { requestAi } from '@/lib/ai-client'
import AiBadge from '@/components/AiBadge'

type AiImpactStoryProps = {
  name?: string
  hours: number
  skills?: string[]
  eventCount?: number
}

export default function AiImpactStory({ name, hours, skills, eventCount }: AiImpactStoryProps) {
  const [story, setStory] = useState<string | null>(null)
  const [source, setSource] = useState('impactmap')
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const { text, source: s } = await requestAi('impact-story', {
        name,
        hours,
        skills: skills ?? [],
        eventCount: eventCount ?? 0,
      })
      setStory(text)
      setSource(s)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-violet-100 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 p-4">
      {!story ? (
        <button
          type="button"
          onClick={generate}
          disabled={loading || hours <= 0}
          className="text-sm font-medium text-violet-700 dark:text-violet-300 hover:underline disabled:opacity-50"
        >
          {loading ? 'Writing your story…' : '✨ AI write my impact story'}
        </button>
      ) : (
        <>
          <AiBadge source={source} />
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{story}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(story)}
            className="mt-2 text-xs text-violet-600 hover:underline"
          >
            Copy to clipboard
          </button>
        </>
      )}
    </div>
  )
}
