'use client'

import { useEffect, useId, useRef, useState } from 'react'

type QrScannerProps = {
  onScan: (text: string) => void
  onError?: (message: string) => void
  className?: string
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
        const message =
          err instanceof Error
            ? err.message
            : 'Could not access camera. Check permissions and try again.'
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
        <p className="text-center text-sm text-gray-500 mt-3">Starting camera…</p>
      )}
      {cameraError && (
        <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {cameraError}
        </div>
      )}
    </div>
  )
}
