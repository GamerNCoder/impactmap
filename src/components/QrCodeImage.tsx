'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

type QrCodeImageProps = {
  value: string
  size?: number
  label?: string
  className?: string
}

export default function QrCodeImage({ value, size = 160, label, className }: QrCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setError('Could not generate QR code')
      })
    return () => {
      cancelled = true
    }
  }, [value, size])

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg"
        style={{ width: size, height: size }}
        aria-hidden
      />
    )
  }

  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={label ?? 'QR code'}
        width={size}
        height={size}
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white"
      />
      {label && (
        <figcaption className="text-xs text-gray-500 mt-2 text-center max-w-[200px]">
          {label}
        </figcaption>
      )}
    </figure>
  )
}
