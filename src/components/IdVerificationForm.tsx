'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import IdVerificationBadge from '@/components/IdVerificationBadge'
import IdVerificationCertificate from '@/components/IdVerificationCertificate'
import {
  ID_ALLOWED_MIME_TYPES,
  ID_ATTESTATION_PROMPT,
  ID_DOCUMENT_TYPES,
  ID_MAX_FILE_BYTES,
  ID_STORAGE_BUCKET,
  MIN_ATTESTATION_LENGTH,
  SELFIE_ALLOWED_MIME_TYPES,
  type IdDocumentType,
  type IdVerificationStatus,
  idStatusDescription,
} from '@/lib/id-verification'
import GuidedAttestationInput from '@/components/GuidedAttestationInput'
import AiAttestationHelper from '@/components/AiAttestationHelper'

type IdVerificationFormProps = {
  status: IdVerificationStatus | string | null
  profileFullName?: string | null
  certificateCode?: string | null
  legalName?: string | null
  verifiedAt?: string | null
  rejectionReason?: string | null
  compact?: boolean
  onSubmitted?: () => void
  skills?: string[]
  preferredCategories?: string[]
}

export default function IdVerificationForm({
  status,
  profileFullName,
  certificateCode,
  legalName,
  verifiedAt,
  rejectionReason,
  compact = false,
  onSubmitted,
  skills,
  preferredCategories,
}: IdVerificationFormProps) {
  const currentStatus = (status ?? 'unverified') as IdVerificationStatus
  const canSubmit = currentStatus === 'unverified' || currentStatus === 'rejected'

  const nameParts = profileFullName?.trim().split(/\s+/) ?? []
  const [documentType, setDocumentType] = useState<IdDocumentType | ''>('')
  const [legalFirstName, setLegalFirstName] = useState(nameParts[0] ?? '')
  const [legalLastName, setLegalLastName] = useState(nameParts.slice(1).join(' ') ?? '')
  const [attestationText, setAttestationText] = useState('')
  const [consent, setConsent] = useState(false)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const validateFile = (
    file: File | null,
    allowed: readonly string[],
    label: string
  ): string | null => {
    if (!file) return `Please upload your ${label}.`
    if (!allowed.includes(file.type)) return `Use a supported image format for ${label}.`
    if (file.size > ID_MAX_FILE_BYTES) return `${label} must be 10 MB or smaller.`
    return null
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!documentType) errors.documentType = 'Please select one ID type.'
    if (!legalFirstName.trim()) errors.legalFirstName = 'Legal first name is required.'
    if (!legalLastName.trim()) errors.legalLastName = 'Legal last name is required.'
    const idErr = validateFile(idFile, ID_ALLOWED_MIME_TYPES, 'ID document')
    if (idErr) errors.idFile = idErr
    const selfieErr = validateFile(selfieFile, SELFIE_ALLOWED_MIME_TYPES, 'selfie')
    if (selfieErr) errors.selfieFile = selfieErr
    if (attestationText.trim().length < MIN_ATTESTATION_LENGTH) {
      errors.attestationText = `Written statement must be at least ${MIN_ATTESTATION_LENGTH} characters.`
    }
    if (!consent) errors.consent = 'You must consent to ID verification.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const uploadFile = async (userId: string, file: File, prefix: string) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${userId}/${prefix}-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from(ID_STORAGE_BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (uploadError) throw uploadError
    return path
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !validate() || !idFile || !selfieFile) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in')

      const documentPath = await uploadFile(user.id, idFile, 'id')
      const selfiePath = await uploadFile(user.id, selfieFile, 'selfie')

      const { error: insertError } = await supabase.from('id_verification_submissions').insert({
        user_id: user.id,
        document_type: documentType,
        legal_first_name: legalFirstName.trim(),
        legal_last_name: legalLastName.trim(),
        document_path: documentPath,
        selfie_path: selfiePath,
        attestation_text: attestationText.trim(),
        status: 'pending',
      })

      if (insertError) throw insertError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ id_verification_status: 'pending', id_certificate_code: null })
        .eq('id', user.id)

      if (profileError) throw profileError

      trackClientEvent(APP_EVENTS.ID_SUBMIT)
      setIdFile(null)
      setSelfieFile(null)
      if (idInputRef.current) idInputRef.current.value = ''
      if (selfieInputRef.current) selfieInputRef.current.value = ''
      onSubmitted?.()
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not submit ID verification')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-sm dark:bg-gray-900'

  const displayName = legalName || `${legalFirstName} ${legalLastName}`.trim()

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {!compact && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Identity verification</h2>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {idStatusDescription(currentStatus)}
          </p>
        </div>
        <IdVerificationBadge status={currentStatus} size={compact ? 'sm' : 'md'} />
      </div>

      {currentStatus === 'rejected' && rejectionReason && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          <strong>Reason:</strong> {rejectionReason}
        </div>
      )}

      {currentStatus === 'verified' && certificateCode && (
        <IdVerificationCertificate
          certificateCode={certificateCode}
          legalName={displayName}
          verifiedAt={verifiedAt}
        />
      )}

      {currentStatus === 'pending' && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-xl text-sm">
          We&apos;re reviewing your ID, selfie, and written statement. This usually takes 1–2 business days.
        </div>
      )}

      {canSubmit && (
        <form onSubmit={handleSubmit} className="space-y-5 border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-gray-900/50">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ID document type <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {ID_DOCUMENT_TYPES.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setDocumentType(doc.id)
                    if (fieldErrors.documentType) setFieldErrors((prev) => ({ ...prev, documentType: '' }))
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    documentType === doc.id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
                  }`}
                >
                  {doc.label}
                </button>
              ))}
            </div>
            {fieldErrors.documentType && (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.documentType}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Legal first name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={legalFirstName}
                onChange={(e) => setLegalFirstName(e.target.value)}
                className={inputClass}
                placeholder="As shown on ID"
              />
              {fieldErrors.legalFirstName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.legalFirstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Legal last name <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={legalLastName}
                onChange={(e) => setLegalLastName(e.target.value)}
                className={inputClass}
                placeholder="As shown on ID"
              />
              {fieldErrors.legalLastName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.legalLastName}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Government ID photo <span className="text-red-500">*</span>
              </label>
              <input
                ref={idInputRef}
                type="file"
                accept={ID_ALLOWED_MIME_TYPES.join(',')}
                onChange={(e) => {
                  setIdFile(e.target.files?.[0] ?? null)
                  if (fieldErrors.idFile) setFieldErrors((prev) => ({ ...prev, idFile: '' }))
                }}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700"
              />
              <p className="mt-1 text-xs text-gray-500">Front of ID · JPEG, PNG, WebP, or PDF</p>
              {fieldErrors.idFile && <p className="mt-1 text-sm text-red-600">{fieldErrors.idFile}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Live selfie <span className="text-red-500">*</span>
              </label>
              <input
                ref={selfieInputRef}
                type="file"
                accept={SELFIE_ALLOWED_MIME_TYPES.join(',')}
                capture="user"
                onChange={(e) => {
                  setSelfieFile(e.target.files?.[0] ?? null)
                  if (fieldErrors.selfieFile) setFieldErrors((prev) => ({ ...prev, selfieFile: '' }))
                }}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700"
              />
              <p className="mt-1 text-xs text-gray-500">Hold ID next to your face or take a clear selfie</p>
              {fieldErrors.selfieFile && <p className="mt-1 text-sm text-red-600">{fieldErrors.selfieFile}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Written identity statement <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">{ID_ATTESTATION_PROMPT}</p>
            <GuidedAttestationInput
              value={attestationText}
              onChange={(text) => {
                setAttestationText(text)
                if (fieldErrors.attestationText) setFieldErrors((prev) => ({ ...prev, attestationText: '' }))
              }}
              firstName={legalFirstName}
              lastName={legalLastName}
              minLength={MIN_ATTESTATION_LENGTH}
              error={fieldErrors.attestationText}
            />
            <AiAttestationHelper
              value={attestationText}
              onApply={setAttestationText}
              firstName={legalFirstName}
              lastName={legalLastName}
              skills={skills}
              categories={preferredCategories}
            />
            {fieldErrors.attestationText && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.attestationText}</p>
            )}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (fieldErrors.consent) setFieldErrors((prev) => ({ ...prev, consent: '' }))
              }}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              I consent to ImpactMap securely storing and reviewing my ID, selfie, and written statement
              to verify my identity. These are kept private and only shown to authorized reviewers.
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="text-sm text-red-600">{fieldErrors.consent}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'Submitting…' : currentStatus === 'rejected' ? 'Resubmit verification' : 'Submit for verification'}
          </button>
        </form>
      )}
    </div>
  )
}
