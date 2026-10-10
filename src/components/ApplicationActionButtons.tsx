'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type ApplicationActionButtonsProps = {
  applicationId: string
  volunteerName: string
  organizationId: string
}

export default function ApplicationActionButtons({
  applicationId,
  organizationId,
}: ApplicationActionButtonsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (status: 'accepted' | 'rejected') => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId)

      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        action: status === 'accepted' ? 'application.accept' : 'application.reject',
        resource_type: 'applications',
        resource_id: applicationId,
      })

      trackClientEvent(
        status === 'accepted' ? APP_EVENTS.APPLICATION_ACCEPT : APP_EVENTS.APPLICATION_REJECT,
        { organizationId, resourceType: 'applications', resourceId: applicationId }
      )

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus('accepted')}
        className="text-sm px-3 py-1 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
      >
        Accept
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={() => updateStatus('rejected')}
        className="text-sm px-3 py-1 rounded-lg border text-red-600 disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  )
}
