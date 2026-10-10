'use client'

import { useState } from 'react'
import { requestAi } from '@/lib/ai-client'

type AiEventDraftButtonProps = {
  title: string
  category: string
  orgName?: string
  location?: string
  remote?: boolean
  onDraft: (description: string) => void
}

export default function AiEventDraftButton({
  title,
  category,
  orgName,
  location,
  remote,
  onDraft,
}: AiEventDraftButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const { text } = await requestAi('event-draft', {
        title,
        category,
        orgName,
        location,
        remote,
      })
      onDraft(text)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || !title.trim()}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800 disabled:opacity-50"
    >
      {loading ? 'Drafting…' : '✨ AI draft description'}
    </button>
  )
}
