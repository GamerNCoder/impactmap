'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateVerificationCode } from '@/lib/impact-passport'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

import RateVolunteerForm from '@/components/RateVolunteerForm'
import CredentialQr from '@/components/CredentialQr'

type VerifyHoursFormProps = {
  hourId: string
  volunteerId: string
  organizationId: string
  opportunityId: string
  volunteerName: string
  hours: number
  date: string
  opportunityTitle: string
}

export default function VerifyHoursForm({
  hourId,
  volunteerId,
  organizationId,
  opportunityId,
  volunteerName,
  hours,
  date,
  opportunityTitle,
}: VerifyHoursFormProps) {
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

      const { error: updateError } = await supabase
        .from('volunteer_hours')
        .update({
          verified: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_code: code,
          supervisor_name: supervisorName,
          supervisor_title: supervisorTitle,
          supervisor_email: supervisorEmail,
          supervisor_notes: notes || null,
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
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  if (verificationCode) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-800">Hours verified for {volunteerName}</p>
          <p className="text-green-700 mt-1">
            Verification code: <strong className="font-mono">{verificationCode}</strong>
          </p>
          <div className="mt-3 flex flex-wrap items-start gap-4">
            <CredentialQr code={verificationCode} label="Share verification QR" />
            <a
              href={`/verify/${verificationCode}`}
              className="text-indigo-600 hover:underline self-center"
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
          volunteerHoursId={hourId}
        />
      </div>
    )
  }

  return (
    <form onSubmit={handleVerify} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
      <div>
        <p className="font-medium text-gray-900">{volunteerName}</p>
        <p className="text-sm text-gray-600">
          {hours}h on {date} · {opportunityTitle}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Supervisor name *</label>
          <input
            required
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
          <input
            required
            value={supervisorTitle}
            onChange={(e) => setSupervisorTitle(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Volunteer Coordinator"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Supervisor email</label>
        <input
          type="email"
          value={supervisorEmail}
          onChange={(e) => setSupervisorEmail(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Optional attestation notes"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Issuing credential…' : 'Verify & issue Impact Passport credential'}
      </button>
    </form>
  )
}
