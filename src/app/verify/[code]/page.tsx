import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatDate } from '@/lib/constants'

type PageProps = {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { code } = await params
  return {
    title: `Verify ${code} | ImpactMap`,
    description: 'Public verification of volunteer credentials on ImpactMap.',
  }
}

export default async function VerifyCredentialPage({ params }: PageProps) {
  const { code } = await params
  const supabase = await createClient()

  const { data: raw } = await supabase.rpc('verify_code', { p_code: code })
  const record = raw as {
    type: 'hours' | 'completion'
    code: string
    name: string | null
    event: string | null
    category: string | null
    organization: string | null
    organizer_verified: boolean | null
    date: string | null
    hours: number | null
    supervisor_name: string | null
    supervisor_title: string | null
    supervisor_notes: string | null
    description: string | null
    verified_at: string | null
    status: string | null
  } | null

  if (!record) {
    notFound()
  }

  const isHours = record.type === 'hours'
  const org = record.organization
    ? { name: record.organization, verified: Boolean(record.organizer_verified) }
    : null
  const volunteer = { full_name: record.name }
  const opp = { title: record.event, category: record.category }
  const supervisorName = record.supervisor_name
  const supervisorTitle = record.supervisor_title
  const supervisorNotes = record.supervisor_notes
  const verifiedAt = record.verified_at

  const credentialType = isHours ? 'Verified service hours' : 'Verified task completion'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="md" />
          </div>
          <p className="text-sm text-gray-500">Impact Passport Verification</p>
        </div>

        {code.startsWith('IMP-DEMO') && (
          <div
            role="note"
            className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            <strong>Demo record.</strong> This is a sample issued by the shared demo organizer, not a
            real student&rsquo;s service record.
          </div>
        )}

        {org && !org.verified && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            <strong>Unverified organizer.</strong> This record was approved by an organization that
            ImpactMap has not verified. Treat the code as the organizer&rsquo;s attestation, not an
            ImpactMap-verified credential.
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-emerald-200 dark:border-emerald-900 overflow-hidden">
          <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-emerald-50 text-sm">{credentialType}</p>
              <p className="font-mono font-bold text-lg">{code}</p>
            </div>
            <svg className="w-10 h-10 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {volunteer?.full_name || 'Volunteer'}
              </h1>
            </div>

            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Organization</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {org?.name || '—'}
                  {org?.verified && ' ✓'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Event / role</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{opp?.title || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-900 dark:text-white">{opp?.category || '—'}</dd>
              </div>
              {isHours && record && (
                <>
                  <div>
                    <dt className="text-gray-500">Service date</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{formatDate(record.date!)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Hours verified</dt>
                    <dd className="font-medium text-gray-900 dark:text-white text-lg">{record.hours}</dd>
                  </div>
                </>
              )}
              {!isHours && record.date && (
                <div>
                  <dt className="text-gray-500">Completed on</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatDate(record.date)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Verified on</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {verifiedAt ? formatDate(verifiedAt.split('T')[0]) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Supervisor</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {supervisorName || '—'}
                  {supervisorTitle && (
                    <span className="text-gray-500 font-normal"> · {supervisorTitle}</span>
                  )}
                </dd>
              </div>
            </dl>

            {isHours && record.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Service notes</p>
                <p className="text-gray-700 dark:text-gray-300">{record.description}</p>
              </div>
            )}

            {supervisorNotes && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Supervisor attestation</p>
                <p className="text-gray-700 dark:text-gray-300 italic">{supervisorNotes}</p>
              </div>
            )}

            <p className="text-xs text-gray-600 border-t border-gray-200 dark:border-gray-800 pt-4">
              Issued by ImpactMap on behalf of the event organizer who approved this record.
              {' '}Reference code {code}.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/" className="text-emerald-700 hover:underline">impactmap.vercel.app</Link>
        </p>
      </div>
    </div>
  )
}
