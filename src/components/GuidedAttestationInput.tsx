'use client'

import { useMemo } from 'react'

export function buildAttestationTemplate(firstName: string, lastName: string): string {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim() || 'your name'
  return `I, ${name}, confirm that the attached ID and selfie are mine and I am joining ImpactMap to volunteer because`
}

type GuidedAttestationInputProps = {
  value: string
  onChange: (value: string) => void
  firstName: string
  lastName: string
  minLength: number
  className?: string
  error?: string
}

export default function GuidedAttestationInput({
  value,
  onChange,
  firstName,
  lastName,
  minLength,
  className = '',
  error,
}: GuidedAttestationInputProps) {
  const template = useMemo(
    () => buildAttestationTemplate(firstName, lastName),
    [firstName, lastName]
  )

  const inGuidedSection = value.length < template.length
  const ghostSuffix = inGuidedSection ? template.slice(value.length) : ''
  const guidedComplete = value.length >= template.length && value.startsWith(template)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value

    if (next.length <= template.length) {
      if (!template.startsWith(next)) return
      onChange(next)
      return
    }

    if (!next.startsWith(template)) return
    onChange(next)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text')
    const el = e.currentTarget
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const merged = value.slice(0, start) + paste + value.slice(end)

    if (merged.length <= template.length) {
      if (template.startsWith(merged)) onChange(merged)
      return
    }
    if (merged.startsWith(template)) onChange(merged)
  }

  return (
    <div>
      <div
        className={`relative rounded-xl border ${
          error
            ? 'border-red-400 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-700'
        } bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500`}
      >
        <div
          aria-hidden
          className={`absolute inset-0 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-hidden rounded-xl ${className}`}
        >
          <span className="text-gray-900 dark:text-white">{value}</span>
          <span className="text-gray-400 dark:text-gray-500">{ghostSuffix}</span>
        </div>
        <textarea
          required
          rows={4}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className={`relative z-10 w-full px-4 py-3 text-sm leading-relaxed bg-transparent text-transparent caret-emerald-500 dark:caret-emerald-400 resize-y min-h-[6.5rem] rounded-xl outline-none ${className}`}
          aria-label="Written identity statement"
        />
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>
          {inGuidedSection
            ? 'Type the highlighted text — one character at a time.'
            : guidedComplete
              ? 'Now add why you are volunteering.'
              : `${value.trim().length}/${minLength} minimum characters`}
        </span>
        {!inGuidedSection && (
          <span>{value.trim().length}/{minLength} min</span>
        )}
      </div>
    </div>
  )
}
