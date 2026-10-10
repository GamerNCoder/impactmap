export const ID_DOCUMENT_TYPES = [
  { id: 'drivers_license', label: "Driver's license" },
  { id: 'state_id', label: 'State / government ID' },
  { id: 'passport', label: 'Passport' },
  { id: 'student_id', label: 'Student ID' },
] as const

export type IdDocumentType = (typeof ID_DOCUMENT_TYPES)[number]['id']

export const ID_VERIFICATION_STATUSES = [
  'unverified',
  'pending',
  'verified',
  'rejected',
] as const

export type IdVerificationStatus = (typeof ID_VERIFICATION_STATUSES)[number]

export const ID_STORAGE_BUCKET = 'id-documents'

export const ID_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

export const ID_MAX_FILE_BYTES = 10 * 1024 * 1024

export const SELFIE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MIN_ATTESTATION_LENGTH = 50
export const MIN_REVIEWER_ATTESTATION_LENGTH = 20

export function generateIdCertificateCode(): string {
  const segment = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return `IDV-${segment}`
}

export const ID_ATTESTATION_PROMPT =
  'Confirm your legal name, that the ID and selfie are yours, and why you are volunteering on ImpactMap.'

export function idStatusLabel(status: IdVerificationStatus | string | null): string {
  switch (status) {
    case 'verified':
      return 'ID verified'
    case 'pending':
      return 'ID verification pending'
    case 'rejected':
      return 'ID verification declined'
    default:
      return 'ID not submitted'
  }
}

export function idStatusDescription(status: IdVerificationStatus | string | null): string {
  switch (status) {
    case 'verified':
      return 'Your government ID was reviewed and confirmed by ImpactMap.'
    case 'pending':
      return 'Your document is in the review queue. You can use ImpactMap while we verify.'
    case 'rejected':
      return 'Your last submission could not be verified. Please upload a clearer document.'
    default:
      return 'Upload your government ID, a live selfie, and a written identity statement.'
  }
}

export function documentTypeLabel(type: string): string {
  return ID_DOCUMENT_TYPES.find((d) => d.id === type)?.label ?? type
}
