'use client'

import { useEffect, useId, useRef, useState } from 'react'

type QrScannerProps = {
  onScan: (text: string) => void
  onError?: (message: string) => void
  className?: string
}

function friendlyCameraError(err: unknown): string {
  const name = err instanceof Error ? err.name : ''
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Camera access was blocked. Allow the camera in your browser settings, or type the code instead.'
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device. Type the code instead.'
    case 'NotReadableError':
      return 'The camera is in use by another app. Close it and try again.'
    default:
      return 'Could not start the camera. Type the code instead.'
  }
}

export default function QrScanner({ onScan, onError, className }: QrScannerProps) {
  const regionId = useId().replace(/:/g, '')
  const lastScan = useRef<string | null>(null)
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  const [starting, setStarting] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    onScanRef.current = onScan
    onErrorRef.current = onError
  }, [onScan, onError])

  useEffect(() => {
    let scanner: { stop: () => Promise<void> } | null = null
    let cancelled = false

    const start = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const instance = new Html5Qrcode(regionId)
        scanner = instance

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
          (decoded) => {
            if (decoded === lastScan.current) return
            lastScan.current = decoded
            onScanRef.current(decoded)
          },
          () => {
            // per-frame decode miss — ignore
          }
        )

        if (!cancelled) setStarting(false)
      } catch (err) {
        const message = friendlyCameraError(err)
        setCameraError(message)
        onErrorRef.current?.(message)
        setStarting(false)
      }
    }

    void start()

    return () => {
      cancelled = true
      void scanner?.stop().catch(() => {})
    }
  }, [regionId])

  return (
    <div className={className}>
      <div
        id={regionId}
        className="w-full overflow-hidden rounded-xl bg-black min-h-[280px]"
        aria-label="QR code scanner camera view"
      />
      {starting && !cameraError && (
        <p role="status" aria-live="polite" className="text-center text-sm text-gray-500 mt-3">Starting camera…</p>
      )}
      {cameraError && (
        <div role="alert" className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {cameraError}
        </div>
      )}
    </div>
  )
}
