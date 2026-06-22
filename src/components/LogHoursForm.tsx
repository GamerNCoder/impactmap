'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type LogHoursFormProps = {
  opportunityId: string
  opportunityTitle: string
}

export default function LogHoursForm({ opportunityId, opportunityTitle }: LogHoursFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const parsedHours = parseFloat(hours)
      if (isNaN(parsedHours) || parsedHours <= 0) {
        throw new Error('Please enter a valid number of hours')
      }

      const { error: insertError } = await supabase.from('volunteer_hours').insert({
        user_id: user.id,
        opportunity_id: opportunityId,
        date,
        hours: parsedHours,
        description: description || null,
      })

      if (insertError) throw insertError

      setSuccess(true)
      setHours('')
      setDescription('')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log hours')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
        Hours logged for <strong>{opportunityTitle}</strong>.
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="ml-2 text-green-700 underline"
        >
          Log more
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-1">Date</label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="hours" className="block text-xs font-medium text-gray-700 mb-1">Hours</label>
          <input
            id="hours"
            type="number"
            step="0.5"
            min="0.5"
            required
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="2.5"
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="What did you work on?"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Log hours'}
      </button>
    </form>
  )
}
