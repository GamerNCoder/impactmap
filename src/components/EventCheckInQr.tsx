'use client'

import { useMemo } from 'react'
import QrCodeImage from '@/components/QrCodeImage'
import { opportunityQrUrl } from '@/lib/qr-links'

type EventCheckInQrProps = {
  opportunityId: string
  title: string
}

export default function EventCheckInQr({ opportunityId, title }: EventCheckInQrProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = useMemo(
    () => (origin ? opportunityQrUrl(origin, opportunityId) : ''),
    [origin, opportunityId]
  )

  if (!origin) return null

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Event check-in QR</p>
      <p className="text-xs text-gray-500 mb-3">
        Volunteers scan to open this event — join or log hours in one step.
      </p>
      <QrCodeImage value={url} label={title} size={140} />
    </div>
  )
}
