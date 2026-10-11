'use client'

import { useOrigin } from '@/lib/use-origin'
import { useMemo } from 'react'
import QrCodeImage from '@/components/QrCodeImage'
import { verifyQrUrl } from '@/lib/qr-links'

type CredentialQrProps = {
  code: string
  label?: string
}

export default function CredentialQr({ code, label = 'Scan to verify' }: CredentialQrProps) {
  const origin = useOrigin()
  const url = useMemo(() => (origin ? verifyQrUrl(origin, code) : ''), [origin, code])

  if (!origin) return null

  return <QrCodeImage value={url} size={100} label={label} />
}
