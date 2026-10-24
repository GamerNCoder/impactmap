'use client'

import QrCodeImage from '@/components/QrCodeImage'
import { checkInQrUrl } from '@/lib/qr-links'
import { useOrigin } from '@/lib/use-origin'
import type { Dictionary } from '@/lib/i18n'

type EventCheckInQrProps = {
  opportunityId: string
  title: string
  dict: Dictionary
}

export default function EventCheckInQr({ opportunityId, title, dict }: EventCheckInQrProps) {
  const origin = useOrigin()

  if (!origin) return null
  const url = checkInQrUrl(origin, opportunityId)

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{dict.event.qr}</p>
      <p className="text-xs text-gray-500 mb-3">
        {dict.event.qrBody}
      </p>
      <QrCodeImage value={url} label={`Check in to ${title}`} size={140} />
      <p className="mt-2 text-xs text-gray-500 break-all">
        {dict.event.qrOpen} <a href={url} className="underline">{url}</a>
      </p>
    </div>
  )
}
