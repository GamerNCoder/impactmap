'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type VerifyOrgButtonProps = {
  organizationId: string
}

export default function VerifyOrgButton({ organizationId }: VerifyOrgButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const verify = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/verify`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? 'Verification failed')
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={verify}
        disabled={loading}
        className="text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
      >
        {loading ? 'Verifying…' : 'Verify organization'}
      </button>
      {error && <p className="text-xs text-red-600 max-w-[12rem] text-right">{error}</p>}
    </div>
  )
}
