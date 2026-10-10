'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  documentTypeLabel,
  generateIdCertificateCode,
  ID_STORAGE_BUCKET,
  MIN_REVIEWER_ATTESTATION_LENGTH,
} from '@/lib/id-verification'
import { formatDate } from '@/lib/constants'

type SubmissionRow = {
  id: string
  user_id: string
  document_type: string
  legal_first_name: string
  legal_last_name: string
  document_path: string
  selfie_path: string | null
  attestation_text: string | null
  submitted_at: string | null
  profiles: { full_name: string | null; email: string | null; date_of_birth: string | null } | null
}

type ReviewIdCardProps = {
  submission: SubmissionRow
}

export default function ReviewIdCard({ submission }: ReviewIdCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idPreviewUrl, setIdPreviewUrl] = useState<string | null>(null)
  const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewerAttestation, setReviewerAttestation] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const profile = submission.profiles

  const loadPreview = async (path: string, type: 'id' | 'selfie') => {
    const { data, error: urlError } = await supabase.storage
      .from(ID_STORAGE_BUCKET)
      .createSignedUrl(path, 300)

    if (urlError) {
      setError(urlError.message)
      return
    }
    if (type === 'id') setIdPreviewUrl(data.signedUrl)
    else setSelfiePreviewUrl(data.signedUrl)
  }

  const review = async (decision: 'verified' | 'rejected') => {
    if (decision === 'rejected' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection.')
      return
    }
    if (decision === 'verified' && reviewerAttestation.trim().length < MIN_REVIEWER_ATTESTATION_LENGTH) {
      setError(`Written approval must be at least ${MIN_REVIEWER_ATTESTATION_LENGTH} characters.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const now = new Date().toISOString()
      const certificateCode = decision === 'verified' ? generateIdCertificateCode() : null

      const { error: submissionError } = await supabase
        .from('id_verification_submissions')
        .update({
          status: decision,
          reviewed_at: now,
          reviewed_by: user.id,
          rejection_reason: decision === 'rejected' ? rejectionReason.trim() : null,
          reviewer_attestation: decision === 'verified' ? reviewerAttestation.trim() : null,
          certificate_code: certificateCode,
        })
        .eq('id', submission.id)

      if (submissionError) throw submissionError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          id_verification_status: decision,
          id_certificate_code: certificateCode,
        })
        .eq('id', submission.user_id)

      if (profileError) throw profileError

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Review failed')
    } finally {
      setLoading(false)
    }
  }

  const renderImage = (url: string, path: string, alt: string) => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {path.toLowerCase().endsWith('.pdf') ? (
        <iframe src={url} title={alt} className="w-full h-72" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className="w-full max-h-72 object-contain bg-gray-100" />
      )}
    </div>
  )

  return (
    <article className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {profile?.full_name || `${submission.legal_first_name} ${submission.legal_last_name}`}
          </p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ID name: {submission.legal_first_name} {submission.legal_last_name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {documentTypeLabel(submission.document_type)}
            {profile?.date_of_birth && ` · DOB ${formatDate(profile.date_of_birth)}`}
          </p>
          {submission.submitted_at && (
            <p className="text-xs text-gray-400 mt-1">
              Submitted {formatDate(submission.submitted_at.split('T')[0])}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <button
            type="button"
            onClick={() => loadPreview(submission.document_path, 'id')}
            className="font-medium text-emerald-600 hover:underline text-left"
          >
            View ID document
          </button>
          {submission.selfie_path && (
            <button
              type="button"
              onClick={() => loadPreview(submission.selfie_path!, 'selfie')}
              className="font-medium text-indigo-600 hover:underline text-left"
            >
              View selfie
            </button>
          )}
        </div>
      </div>

      {submission.attestation_text && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Volunteer written statement
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
            &ldquo;{submission.attestation_text}&rdquo;
          </p>
        </div>
      )}

      {idPreviewUrl && renderImage(idPreviewUrl, submission.document_path, 'ID document')}
      {selfiePreviewUrl && submission.selfie_path && renderImage(selfiePreviewUrl, submission.selfie_path, 'Selfie')}

      {error && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Written approval for public certificate (required to approve)
        </label>
        <textarea
          value={reviewerAttestation}
          onChange={(e) => setReviewerAttestation(e.target.value)}
          rows={3}
          placeholder="I have reviewed the government ID, live selfie, and written statement and confirm this volunteer's identity..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          {reviewerAttestation.trim().length}/{MIN_REVIEWER_ATTESTATION_LENGTH} minimum · shown on public certificate
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Rejection reason (if declining)</label>
        <input
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="e.g. Selfie does not match ID, statement incomplete"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => review('verified')}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          Approve &amp; issue certificate
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => review('rejected')}
          className="px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </article>
  )
}
