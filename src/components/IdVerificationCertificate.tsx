import Link from 'next/link'
import { formatDate } from '@/lib/constants'

type IdVerificationCertificateProps = {
  certificateCode: string
  legalName?: string
  verifiedAt?: string | null
  compact?: boolean
}

export default function IdVerificationCertificate({
  certificateCode,
  legalName,
  verifiedAt,
  compact = false,
}: IdVerificationCertificateProps) {
  return (
    <article
      className={`border-2 border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden ${
        compact ? '' : 'shadow-sm'
      }`}
    >
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-4">
        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">
          Identity Verification Certificate
        </p>
        <p className="font-mono font-bold text-lg mt-1">{certificateCode}</p>
      </div>
      <div className={`bg-white dark:bg-gray-900 ${compact ? 'p-4' : 'p-5'} space-y-3`}>
        {legalName && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Issued to <strong className="text-gray-900 dark:text-white">{legalName}</strong>
          </p>
        )}
        {verifiedAt && (
          <p className="text-xs text-gray-500">
            Verified {formatDate(verifiedAt.split('T')[0])}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Government ID, live selfie, and written attestation reviewed by ImpactMap.
        </p>
        <Link
          href={`/verify/${certificateCode}`}
          className="inline-flex text-sm font-semibold text-indigo-600 hover:underline"
          target="_blank"
        >
          View public certificate →
        </Link>
      </div>
    </article>
  )
}
