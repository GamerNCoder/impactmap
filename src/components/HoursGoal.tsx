'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PRESETS = [10, 20, 40, 50, 100]

// Progress toward the student's own target (school requirement, NHS, etc.).
export default function HoursGoal({
  userId,
  verifiedHours,
  goal,
  editable = true,
  light = false,
}: {
  userId?: string
  verifiedHours: number
  goal: number | null
  editable?: boolean
  light?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(goal ?? 40))
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const pct = goal ? Math.min(100, Math.round((verifiedHours / goal) * 100)) : 0
  const remaining = goal ? Math.max(0, goal - verifiedHours) : 0

  const save = async (next: number) => {
    if (!userId || !Number.isFinite(next) || next < 1 || next > 1000) return
    setSaving(true)
    const { error } = await createClient().from('profiles').update({ hours_goal: next }).eq('id', userId)
    setSaving(false)
    if (!error) {
      setEditing(false)
      router.refresh()
    }
  }

  if (editing || (!goal && editable)) {
    return (
      <div>
        <p className="text-sm font-medium mb-2">How many hours do you need?</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => save(n)}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-semibold"
            >
              {n}h
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save(parseInt(value, 10))
            }}
            className="flex gap-1"
          >
            <label htmlFor="goal-custom" className="sr-only">Custom goal in hours</label>
            <input
              id="goal-custom"
              type="number"
              min={1}
              max={1000}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-20 rounded-lg px-2 py-1.5 text-sm text-gray-900"
            />
            <button type="submit" disabled={saving} className="px-3 py-1.5 rounded-lg bg-white text-emerald-800 text-sm font-semibold">
              Set
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!goal) return null

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm mb-2">
        <span className="font-semibold">
          {verifiedHours.toFixed(1)} of {goal} hours
        </span>
        <span className={light ? 'text-gray-600' : 'opacity-80'}>
          {remaining > 0 ? `${remaining.toFixed(1)} to go` : 'Goal reached 🎉'}
          {editable && (
            <button type="button" onClick={() => setEditing(true)} className="ml-3 underline print:hidden">
              Change
            </button>
          )}
        </span>
      </div>
      <div
        className={`h-3 rounded-full overflow-hidden ${light ? 'bg-gray-200' : 'bg-white/20'}`}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress toward hours goal"
      >
        <div className={`h-full rounded-full ${light ? 'bg-emerald-700' : 'bg-white'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
