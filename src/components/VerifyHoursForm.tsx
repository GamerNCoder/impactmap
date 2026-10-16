'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateVerificationCode } from '@/lib/impact-passport'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type VerifyHoursFormProps = {
  hourId: string
  organizationId: string
  volunteerName: string
  hours: number
  date: string
  description: string | null
  opportunityTitle: string
  approverName: string
  approverEmail: string | null
}

// One-tap approval: the signed-in organizer is the attesting supervisor.
export default function VerifyHoursForm({
  hourId,
  organizationId,
  volunteerName,
  hours,
  date,
  description,
  opportunityTitle,
  approverName,
  approverEmail,
}: VerifyHoursFormProps) {
  const [approverTitle, setApproverTitle] = useState('Event organizer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in')

      const code = generateVerificationCode()

      const { error: updateError } = await supabase
        .from('volunteer_hours')
        .update({
          verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_code: code,
          supervisor_name: approverName,
          supervisor_title: approverTitle.trim() || 'Event organizer',
          supervisor_email: approverEmail,
        })
        .eq('id', hourId)
        .eq('verified', false)

      if (updateError) throw updateError

      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        action: 'hours.verify',
        resource_type: 'volunteer_hours',
        resource_id: hourId,
        metadata: { organization_id: organizationId, verification_code: code },
      })

      trackClientEvent(APP_EVENTS.HOURS_VERIFY, {
        organizationId,
        resourceType: 'volunteer_hours',
        resourceId: hourId,
      })

      setVerificationCode(code)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setLoading(false)
    }
  }

  if (verificationCode) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-sm">
        <p className="font-medium text-emerald-800 dark:text-emerald-200">
          Approved {hours}h for {volunteerName}
        </p>
        <p className="text-emerald-700 dark:text-emerald-300 mt-1">
          Their code: <strong className="font-mono">{verificationCode}</strong>{' '}
          <a href={`/verify/${verificationCode}`} className="underline" target="_blank" rel="noopener noreferrer">
            view
          </a>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleVerify} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3 bg-white dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{volunteerName}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {opportunityTitle} · {date}
          </p>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{hours}h</p>
      </div>
      {description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
          “{description}”
        </p>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor={`title-${hourId}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Signing as {approverName} — your role
          </label>
          <input
            id={`title-${hourId}`}
            value={approverTitle}
            onChange={(e) => setApproverTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Approving…' : `Approve ${hours}h`}
        </button>
      </div>
    </form>
  )
}
