'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import QrScanner from '@/components/QrScanner'
import {
  describeScanAction,
  parseQrScan,
  routeForScanAction,
  type QrScanAction,
} from '@/lib/qr-scan'

type QrScanLauncherProps = {
  /** Button label */
  label?: string
  /** Compact icon-only style for navbar */
  variant?: 'button' | 'icon' | 'link'
  className?: string
  /** Called after a successful scan before navigation */
  onResolved?: (action: QrScanAction) => void
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function QrScanLauncher({
  label = 'Scan QR',
  variant = 'button',
  className = '',
  onResolved,
}: QrScanLauncherProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<QrScanAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setPending(null)
    setError(null)
  }, [])

  // Modal behaviour: focus moves in, Tab is trapped, Escape closes, focus returns to the trigger.
  useEffect(() => {
    if (!open) return

    lastFocused.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab') return

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes)
      const first = list[0]
      const last = list[list.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      lastFocused.current?.focus?.()
    }
  }, [open, close])

  const handleScan = useCallback(
    (text: string) => {
      setError(null)
      const action = parseQrScan(text)
      if (!action) {
        setError('Unrecognized code. Scan an ImpactMap event, passport, or IMP- credential.')
        return
      }
      setPending(action)
    },
    []
  )

  const confirmNavigate = () => {
    if (!pending) return
    onResolved?.(pending)
    const route = routeForScanAction(pending)
    if (pending.type === 'external') {
      window.location.href = route
    } else {
      router.push(route)
    }
    close()
  }

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 motion-pressable motion-focus-ring ${className}`}
        aria-label="Scan QR code"
        aria-haspopup="dialog"
        title="Scan QR code"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 7h.01M7 3h3M3 7v3M21 7v3M7 21v-3M21 17h-3M17 21v-3"
          />
        </svg>
      </button>
    ) : variant === 'link' ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm font-medium text-emerald-700 hover:underline ${className}`}
        aria-haspopup="dialog"
      >
        {label}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 motion-pressable motion-focus-ring ${className}`}
        aria-haspopup="dialog"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
          />
        </svg>
        {label}
      </button>
    )

  return (
    <>
      {trigger}

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-4 motion-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-scan-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div
            ref={panelRef}
            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden motion-modal-panel"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 id="qr-scan-title" className="font-semibold text-gray-900 dark:text-white">
                Scan QR code
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-white p-1 motion-focus-ring"
                aria-label="Close scanner"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!pending ? (
                <div key="scan" className="space-y-4 motion-fade-in-up">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Point your camera at an event check-in, Impact Passport, or IMP- verification code.
                  </p>
                  <QrScanner onScan={handleScan} onError={setError} />
                  {error && (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400 motion-shake">{error}</p>
                  )}
                </div>
              ) : (
                <div key="confirm" className="space-y-4 motion-fade-in-scale">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4">
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      {describeScanAction(pending)}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Tap continue to open and autofill the right screen.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPending(null)}
                      className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium motion-pressable motion-focus-ring"
                    >
                      Scan again
                    </button>
                    <button
                      type="button"
                      onClick={confirmNavigate}
                      className="flex-1 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 motion-pressable motion-focus-ring"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
