'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CoordinatorRequestActionsProps = {
  requestId: string
  organizationId: string
  userId: string
  userName: string
}

export default function CoordinatorRequestActions({
  requestId,
  organizationId,
  userName,
}: CoordinatorRequestActionsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const respond = async (status: 'approved' | 'rejected') => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/org/${organizationId}/coordinator-requests/${requestId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Request failed')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => respond('approved')}
          className="text-sm px-3 py-1 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
        >
          Approve {userName}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => respond('rejected')}
          className="text-sm px-3 py-1 rounded-lg border text-red-600 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
