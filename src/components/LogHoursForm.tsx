'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

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

      trackClientEvent(APP_EVENTS.HOURS_LOG, {
        resourceType: 'opportunity',
        resourceId: opportunityId,
      })

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
      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-lg text-sm">
        Hours logged for <strong>{opportunityTitle}</strong>. Pending organizer approval — check your{' '}
        <a href="/passport" className="underline font-medium">hours page</a> once approved.
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="ml-2 text-emerald-700 dark:text-emerald-300 underline"
        >
          Log more
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`date-${opportunityId}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            id={`date-${opportunityId}`}
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`hours-${opportunityId}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hours</label>
          <input
            id={`hours-${opportunityId}`}
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
        <label htmlFor={`description-${opportunityId}`} className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
        <input
          id={`description-${opportunityId}`}
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
        className="w-full bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Log hours'}
      </button>
    </form>
  )
}
