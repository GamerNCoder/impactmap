'use client'

import { useMemo } from 'react'
import QrCodeImage from '@/components/QrCodeImage'
import { volunteerPassportQrUrl } from '@/lib/qr-links'

type PassportQrCardProps = {
  volunteerId: string
  volunteerName?: string
}

export default function PassportQrCard({ volunteerId, volunteerName }: PassportQrCardProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = useMemo(
    () => (origin ? volunteerPassportQrUrl(origin, volunteerId) : ''),
    [origin, volunteerId]
  )

  if (!origin) return null

  return (
    <div className="inline-flex flex-col items-center">
      <QrCodeImage
        value={url}
        size={120}
        label={volunteerName ? `Scan ${volunteerName}'s passport` : 'Scan to view passport'}
      />
    </div>
  )
}
