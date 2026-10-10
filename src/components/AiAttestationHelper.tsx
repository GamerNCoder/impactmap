'use client'

import { useState } from 'react'
import { requestAi } from '@/lib/ai-client'
import { buildAttestationTemplate } from '@/components/GuidedAttestationInput'
import AiBadge from '@/components/AiBadge'

type AiAttestationHelperProps = {
  value: string
  onApply: (text: string) => void
  firstName: string
  lastName: string
  skills?: string[]
  categories?: string[]
}

export default function AiAttestationHelper({
  value,
  onApply,
  firstName,
  lastName,
  skills,
  categories,
}: AiAttestationHelperProps) {
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<string>('impactmap')
  const template = buildAttestationTemplate(firstName, lastName)
  const guidedComplete = value.startsWith(template) && value.length >= template.length

  if (!guidedComplete) return null

  const handleSuggest = async () => {
    setLoading(true)
    try {
      const { text, source: s } = await requestAi('attestation-why', {
        firstName,
        skills: skills ?? [],
        categories: categories ?? [],
      })
      setSource(s)
      const suffix = text.startsWith(' ') ? text : ` ${text}`
      onApply(template + suffix.trimStart())
    } finally {
      setLoading(false)
    }
  }

  const hasCustomReason = value.length > template.length + 5

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleSuggest}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Thinking…' : hasCustomReason ? '✨ Re-suggest my why' : '✨ AI write my why'}
      </button>
      {!loading && hasCustomReason && <AiBadge source={source} />}
    </div>
  )
}
