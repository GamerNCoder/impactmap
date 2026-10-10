import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { formatDate } from '@/lib/constants'
import { formatImpactValue, HOUR_VALUATION_USD } from '@/lib/impact-passport'
import { documentTypeLabel } from '@/lib/id-verification'

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

  const { data: identityRecord } = await supabase
    .from('id_verification_submissions')
    .select('*')
    .eq('certificate_code', code)
    .eq('status', 'verified')
    .maybeSingle()

  if (identityRecord) {
    const { data: volunteer } = await supabase
      .from('profiles')
      .select('full_name, email, location')
      .eq('id', identityRecord.user_id)
      .maybeSingle()

    const { data: reviewer } = identityRecord.reviewed_by
      ? await supabase.from('profiles').select('full_name').eq('id', identityRecord.reviewed_by).maybeSingle()
      : { data: null }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <Logo size="md" />
            </div>
            <p className="text-sm text-gray-500">Impact Passport Verification</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-indigo-200 dark:border-indigo-900 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Identity Verification Certificate</p>
                <p className="font-mono font-bold text-lg">{code}</p>
              </div>
              <svg className="w-10 h-10 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {identityRecord.legal_first_name} {identityRecord.legal_last_name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">{volunteer?.email}</p>
                {volunteer?.location && (
                  <p className="text-sm text-gray-500 mt-1">{volunteer.location}</p>
                )}
              </div>

              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Document type</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {documentTypeLabel(identityRecord.document_type)}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Verified on</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {identityRecord.reviewed_at
                      ? formatDate(identityRecord.reviewed_at.split('T')[0])
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">ID document</dt>
                  <dd className="font-medium text-emerald-600">Reviewed ✓</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Live selfie</dt>
                  <dd className="font-medium text-emerald-600">
                    {identityRecord.selfie_path ? 'Reviewed ✓' : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Reviewed by</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {reviewer?.full_name || 'ImpactMap verifier'}
                  </dd>
                </div>
              </dl>

              {identityRecord.attestation_text && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Volunteer written statement</p>
                  <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                    &ldquo;{identityRecord.attestation_text}&rdquo;
                  </p>
                </div>
              )}

              {identityRecord.reviewer_attestation && (
                <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-lg p-4">
                  <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1 font-medium">
                    Official approval statement
                  </p>
                  <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                    {identityRecord.reviewer_attestation}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
                This certificate confirms that ImpactMap reviewed the volunteer&apos;s government ID,
                live selfie photo, and written identity statement. Reference code {code}.
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/" className="text-emerald-600 hover:underline">impactmap.vercel.app</Link>
          </p>
        </div>
      </div>
    )
  }

  const { data: hourRecord } = await supabase
    .from('volunteer_hours')
    .select(`
      *,
      opportunities(title, category, organizations(name, verified))
    `)
    .eq('verification_code', code)
    .eq('verified', true)
    .maybeSingle()

  const { data: completionRecord } = !hourRecord
    ? await supabase
        .from('applications')
        .select(`
          *,
          opportunities(title, category, organizations(name, verified))
        `)
        .eq('verification_code', code)
        .eq('status', 'completed')
        .maybeSingle()
    : { data: null }

  if (!hourRecord && !completionRecord) {
    notFound()
  }

  const isHours = Boolean(hourRecord)
  const record = hourRecord ?? completionRecord!
  const userId = isHours ? hourRecord!.user_id : completionRecord!.user_id

  const { data: volunteer } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId!)
    .maybeSingle()

  const opp = record.opportunities as {
    title: string
    category: string
    organizations: { name: string; verified: boolean } | null
  } | null
  const org = opp?.organizations

  const credentialType = isHours ? 'Verified service hours' : 'Verified task completion'
  const supervisorName = isHours ? hourRecord!.supervisor_name : completionRecord!.supervisor_name
  const supervisorTitle = isHours ? hourRecord!.supervisor_title : completionRecord!.supervisor_title
  const supervisorNotes = isHours ? hourRecord!.supervisor_notes : completionRecord!.supervisor_notes
  const verifiedAt = isHours ? hourRecord!.verified_at : completionRecord!.verified_at

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="md" />
          </div>
          <p className="text-sm text-gray-500">Impact Passport Verification</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-green-200 dark:border-green-900 overflow-hidden">
          <div className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{credentialType}</p>
              <p className="font-mono font-bold text-lg">{code}</p>
            </div>
            <svg className="w-10 h-10 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {volunteer?.full_name || 'Volunteer'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{volunteer?.email}</p>
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
              {isHours && hourRecord && (
                <>
                  <div>
                    <dt className="text-gray-500">Service date</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{formatDate(hourRecord.date)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Hours verified</dt>
                    <dd className="font-medium text-gray-900 dark:text-white text-lg">{hourRecord.hours}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Estimated value</dt>
                    <dd className="font-medium text-emerald-600">
                      {formatImpactValue(Number(hourRecord.hours))}
                    </dd>
                  </div>
                </>
              )}
              {!isHours && completionRecord?.completed_at && (
                <div>
                  <dt className="text-gray-500">Completed on</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatDate(completionRecord.completed_at.split('T')[0])}
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

            {isHours && hourRecord?.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Service notes</p>
                <p className="text-gray-700 dark:text-gray-300">{hourRecord.description}</p>
              </div>
            )}

            {supervisorNotes && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Supervisor attestation</p>
                <p className="text-gray-700 dark:text-gray-300 italic">{supervisorNotes}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
              Issued by ImpactMap on behalf of a verified event coordinator.
              {isHours && ` Hour valuation uses Independent Sector rate ($${HOUR_VALUATION_USD}/hr).`}
              {' '}Reference code {code}.
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/" className="text-emerald-600 hover:underline">impactmap.vercel.app</Link>
        </p>
      </div>
    </div>
  )
}
