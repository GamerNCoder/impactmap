'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function VerificationRequestActions({
  requestId,
  organizationId,
}: {
  requestId: string
  organizationId: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const decide = async (approve: boolean) => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sign in again.'); setLoading(false); return }
    const { error: requestError } = await supabase
      .from('verification_requests')
      .update({ status: approve ? 'approved' : 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
    if (requestError) { setError(requestError.message); setLoading(false); return }
    if (approve) {
      const { error: orgError } = await supabase.from('organizations').update({ verified: true }).eq('id', organizationId)
      if (orgError) { setError(orgError.message); setLoading(false); return }
    }
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <button type="button" disabled={loading} onClick={() => decide(true)} className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50">
        Approve
      </button>
      <button type="button" disabled={loading} onClick={() => decide(false)} className="border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50">
        Reject
      </button>
    </div>
  )
}
