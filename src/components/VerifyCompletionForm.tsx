'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateVerificationCode } from '@/lib/impact-passport'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

import RateVolunteerForm from '@/components/RateVolunteerForm'
import CredentialQr from '@/components/CredentialQr'

type VerifyCompletionFormProps = {
  applicationId: string
  volunteerId: string
  organizationId: string
  opportunityId: string
  volunteerName: string
  opportunityTitle: string
}

export default function VerifyCompletionForm({
  applicationId,
  volunteerId,
  organizationId,
  opportunityId,
  volunteerName,
  opportunityTitle,
}: VerifyCompletionFormProps) {
  const [supervisorName, setSupervisorName] = useState('')
  const [supervisorTitle, setSupervisorTitle] = useState('')
  const [supervisorEmail, setSupervisorEmail] = useState('')
  const [notes, setNotes] = useState('')
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
      const now = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'completed',
          completed_at: now,
          verified_at: now,
          verified_by: user.id,
          verification_code: code,
          supervisor_name: supervisorName,
          supervisor_title: supervisorTitle,
          supervisor_email: supervisorEmail || null,
          supervisor_notes: notes || null,
        })
        .eq('id', applicationId)
        .in('status', ['accepted', 'pending'])

      if (updateError) throw updateError

      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        action: 'completion.verify',
        resource_type: 'applications',
        resource_id: applicationId,
        metadata: { organization_id: organizationId, verification_code: code },
      })

      trackClientEvent(APP_EVENTS.COMPLETION_VERIFY, {
        organizationId,
        resourceType: 'applications',
        resourceId: applicationId,
      })

      setVerificationCode(code)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNoShow = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ no_show: true, status: 'rejected' })
        .eq('id', applicationId)

      if (updateError) throw updateError
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (verificationCode) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm">
          <p className="font-medium text-green-800 dark:text-green-200">
            Task verified for {volunteerName}
          </p>
          <p className="text-green-700 dark:text-green-300 mt-1">
            Completion code: <strong className="font-mono">{verificationCode}</strong>
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <CredentialQr code={verificationCode} label="Share verification QR" />
            <a
              href={`/verify/${verificationCode}`}
              className="text-emerald-600 hover:underline self-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              View public credential →
            </a>
          </div>
        </div>
        <RateVolunteerForm
          volunteerId={volunteerId}
          volunteerName={volunteerName}
          organizationId={organizationId}
          opportunityId={opportunityId}
          opportunityTitle={opportunityTitle}
          applicationId={applicationId}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleVerify} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{volunteerName}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{opportunityTitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor name *</label>
          <input
            required
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input
            required
            value={supervisorTitle}
            onChange={(e) => setSupervisorTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
            placeholder="Event coordinator"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Supervisor email</label>
        <input
          type="email"
          value={supervisorEmail}
          onChange={(e) => setSupervisorEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Completion notes</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
          placeholder="Optional attestation notes"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-w-[140px] bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'Verify task completed'}
        </button>
        <button
          type="button"
          onClick={handleNoShow}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
        >
          No-show
        </button>
      </div>
    </form>
  )
}
