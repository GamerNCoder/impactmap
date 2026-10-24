'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RequestVerification({
  organizationId,
  existing,
}: {
  organizationId: string
  existing?: 'pending' | 'approved' | 'rejected'
}) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(existing === 'pending')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('Sign in again to request verification.')
      setLoading(false)
      return
    }
    const { error: insertError } = await supabase.from('verification_requests').insert({
      organization_id: organizationId,
      requested_by: user.id,
      message: message.trim() || null,
    })
    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-300">
        Verification request submitted. A platform admin will review it.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label htmlFor="verification-message" className="block text-sm font-medium text-gray-900 dark:text-white">
        Why should ImpactMap verify this organization?
      </label>
      <textarea
        id="verification-message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
        placeholder="School, nonprofit, or community partner; a contact who can confirm your role."
      />
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Request verification'}
      </button>
    </form>
  )
}
