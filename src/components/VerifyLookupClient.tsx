'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import QrScanner from '@/components/QrScanner'
import BulkVerifyPanel from '@/components/BulkVerifyPanel'
import {
  describeScanAction,
  parseQrScan,
  routeForScanAction,
  type QrScanAction,
} from '@/lib/qr-scan'

type Mode = 'form' | 'scan' | 'list'

const MODES: Mode[] = ['form', 'scan', 'list']

export default function VerifyLookupClient() {
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<Mode>('form')
  const [pending, setPending] = useState<QrScanAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const goToCode = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError('Enter or scan an IMP- verification code.')
      return
    }
    // Accept a pasted link (…/verify/IMP-XXXX) or a bare code.
    const extracted = trimmed.match(/\/verify\/([^/?#\s]+)/i)?.[1] ?? trimmed
    const cleaned = decodeURIComponent(extracted).replace(/[\s/]+$/, '')
    const normalized = cleaned.toUpperCase().startsWith('IMP-')
      ? cleaned.toUpperCase()
      : `IMP-${cleaned.replace(/^IMP-?/i, '').toUpperCase()}`
    if (!/^IMP-[A-Z0-9]{6,}$/.test(normalized)) {
      setError('That does not look like an IMP- code. Codes have 12 letters or digits after the dash.')
      return
    }
    setError(null)
    router.push(`/verify/${encodeURIComponent(normalized)}`)
  }

  const handleScan = useCallback((text: string) => {
    setError(null)
    const action = parseQrScan(text)
    if (!action) {
      setError('Unrecognized code. Try an IMP- credential or ImpactMap link.')
      return
    }
    if (action.type === 'verify') {
      router.push(routeForScanAction(action))
      return
    }
    setPending(action)
  }, [router])

  const selectMode = (next: Mode) => {
    setMode(next)
    setPending(null)
    setError(null)
  }

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const current = MODES.indexOf(mode)
    const step = e.key === 'ArrowRight' ? 1 : -1
    const next = MODES[(current + step + MODES.length) % MODES.length]
    selectMode(next)
    document.getElementById(`verify-tab-${next}`)?.focus()
  }

  const tabClass = (target: Mode) =>
    `flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 motion-pressable motion-focus-ring ${
      mode === target
        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
        : 'text-gray-600 dark:text-gray-400'
    }`

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Look up a code" className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          type="button"
          role="tab"
          id="verify-tab-form"
          aria-selected={mode === 'form'}
          aria-controls="verify-panel-form"
          tabIndex={mode === 'form' ? 0 : -1}
          onClick={() => selectMode('form')}
          onKeyDown={onTabKeyDown}
          className={tabClass('form')}
        >
          Enter code
        </button>
        <button
          type="button"
          role="tab"
          id="verify-tab-scan"
          aria-selected={mode === 'scan'}
          aria-controls="verify-panel-scan"
          tabIndex={mode === 'scan' ? 0 : -1}
          onClick={() => selectMode('scan')}
          onKeyDown={onTabKeyDown}
          className={tabClass('scan')}
        >
          Scan QR
        </button>
        <button
          type="button"
          role="tab"
          id="verify-tab-list"
          aria-selected={mode === 'list'}
          aria-controls="verify-panel-list"
          tabIndex={mode === 'list' ? 0 : -1}
          onClick={() => selectMode('list')}
          onKeyDown={onTabKeyDown}
          className={tabClass('list')}
        >
          Check a list
        </button>
      </div>

      {mode === 'form' ? (
        <form
          key="form"
          id="verify-panel-form"
          role="tabpanel"
          aria-labelledby="verify-tab-form"
          onSubmit={(e) => {
            e.preventDefault()
            goToCode(code)
          }}
          className="space-y-4 motion-fade-in-up"
        >
          <div>
            <label htmlFor="verify-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              IMP- verification code
            </label>
            <input
              id="verify-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="IMP-A4F92B1C2D3E"
              className="w-full font-mono rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 dark:bg-gray-900"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 motion-pressable"
          >
            Look up credential
          </button>
        </form>
      ) : mode === 'scan' ? (
        <div key="scan" id="verify-panel-scan" role="tabpanel" aria-labelledby="verify-tab-scan" className="space-y-4 motion-fade-in-up">
          {!pending ? (
            <>
              <QrScanner onScan={handleScan} onError={setError} />
              {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400 motion-shake">{error}</p>}
            </>
          ) : (
            <div className="space-y-4 motion-fade-in-scale">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 p-4">
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  {describeScanAction(pending)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(routeForScanAction(pending))}
                className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold motion-pressable"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="w-full py-2 text-sm text-gray-600"
              >
                Scan again
              </button>
            </div>
          )}
        </div>
      ) : (
        <div key="list" id="verify-panel-list" role="tabpanel" aria-labelledby="verify-tab-list" className="motion-fade-in-up">
          <BulkVerifyPanel />
        </div>
      )}
    </div>
  )
}
