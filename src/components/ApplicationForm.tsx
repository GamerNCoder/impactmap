'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ApplicationFormProps = {
  opportunityId: string
  opportunityTitle: string
}

export default function ApplicationForm({ opportunityId, opportunityTitle }: ApplicationFormProps) {
  const [coverLetter, setCoverLetter] = useState('')
  const [availability, setAvailability] = useState('')
  const [experience, setExperience] = useState('')
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

      const { error: insertError } = await supabase.from('applications').insert({
        opportunity_id: opportunityId,
        user_id: user.id,
        cover_letter: coverLetter,
        availability,
        experience,
      })

      if (insertError) throw insertError

      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit application'
      if (message.includes('duplicate') || message.includes('unique')) {
        setError('You have already applied to this opportunity.')
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
        Application submitted for <strong>{opportunityTitle}</strong>. Check your dashboard for updates.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
          Why do you want to volunteer?
        </label>
        <textarea
          id="coverLetter"
          required
          rows={4}
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Share your motivation and what you hope to contribute..."
        />
      </div>
      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
          Availability
        </label>
        <input
          id="availability"
          required
          type="text"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g. Weekends, 4 hours/week"
        />
      </div>
      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
          Relevant experience
        </label>
        <textarea
          id="experience"
          rows={3}
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Optional: skills or past volunteer work"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Apply now'}
      </button>
    </form>
  )
}
