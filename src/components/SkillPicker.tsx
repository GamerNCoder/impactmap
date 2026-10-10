'use client'

import { VOLUNTEER_SKILLS } from '@/lib/skills'

type SkillPickerProps = {
  selected: string[]
  onChange: (skills: string[]) => void
  error?: string | null
  hint?: string
}

export default function SkillPicker({ selected, onChange, error, hint }: SkillPickerProps) {
  const toggle = (skill: string) => {
    onChange(
      selected.includes(skill)
        ? selected.filter((s) => s !== skill)
        : [...selected, skill]
    )
  }

  return (
    <div>
      {hint && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{hint}</p>
      )}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Select skills">
        {VOLUNTEER_SKILLS.map((skill) => {
          const active = selected.includes(skill)
          return (
            <button
              key={skill}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(skill)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
              }`}
            >
              {skill}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {selected.length} skill{selected.length !== 1 ? 's' : ''} selected
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
