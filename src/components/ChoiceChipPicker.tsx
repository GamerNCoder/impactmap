'use client'

type ChoiceChipPickerProps = {
  options: readonly string[]
  selected: string[]
  onChange: (values: string[]) => void
  error?: string | null
  min?: number
}

export default function ChoiceChipPicker({
  options,
  selected,
  onChange,
  error,
  min = 1,
}: ChoiceChipPickerProps) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(option)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border motion-chip ${
                active
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {selected.length} selected{min > 1 ? ` (minimum ${min})` : ''}
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
