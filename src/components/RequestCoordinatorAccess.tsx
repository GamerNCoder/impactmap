'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { sanitizeText } from '@/lib/security'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type RequestCoordinatorAccessProps = {
  organizationId: string
  organizationName: string
  existingRequest?: 'pending' | 'rejected' | null
}

export default function RequestCoordinatorAccess({
  organizationId,
  organizationName,
  existingRequest,
}: RequestCoordinatorAccessProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(existingRequest === 'pending')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?next=/organizations/${organizationId}/manage`)
        return
      }

      const { error: insertError } = await supabase.from('coordinator_requests').insert({
        organization_id: organizationId,
        user_id: user.id,
        message: sanitizeText(message, 500) || null,
        status: 'pending',
      })

      if (insertError) throw insertError
      trackClientEvent(APP_EVENTS.ORG_COORDINATOR_REQUEST, { organizationId })
      setSubmitted(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not submit request')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
        Your coordinator access request for <strong>{organizationName}</strong> is pending approval from an existing coordinator.
      </div>
    )
  }

  if (existingRequest === 'rejected') {
    return (
      <p className="text-sm text-gray-600">
        Your previous request was declined. Contact the organization directly if you believe this was an error.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Coordinator access requires approval from an existing organization owner. This protects volunteer data and verification integrity.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Why do you need access?</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          required
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="e.g. I manage volunteer programs for this nonprofit"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Submitting…' : 'Request coordinator access'}
      </button>
    </form>
  )
}
