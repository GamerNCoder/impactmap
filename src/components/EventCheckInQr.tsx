'use client'

import QrCodeImage from '@/components/QrCodeImage'
import { checkInQrUrl } from '@/lib/qr-links'
import { useOrigin } from '@/lib/use-origin'

type EventCheckInQrProps = {
  opportunityId: string
  title: string
}

export default function EventCheckInQr({ opportunityId, title }: EventCheckInQrProps) {
  const origin = useOrigin()

  if (!origin) return null
  const url = checkInQrUrl(origin, opportunityId)

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Event check-in QR</p>
      <p className="text-xs text-gray-500 mb-3">
        Print this for the sign-in table. Volunteers scan it on arrival — that records they showed up,
        and they can log hours straight afterwards.
      </p>
      <QrCodeImage value={url} label={`Check in to ${title}`} size={140} />
    </div>
  )
}
