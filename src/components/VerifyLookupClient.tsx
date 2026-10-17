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

type Mode = 'codes' | 'scan'

const MODES: Mode[] = ['codes', 'scan']

const MAX_CODES = 200
const CODE_PATTERN = /^IMP-[A-Z0-9]{6,}$/

/**
 * Normalize one pasted token into a bare IMP- code, or return null.
 * Accepts a bare code (with or without the IMP- prefix) and pasted links of
 * the form …/verify/IMP-XXXX.
 */
function normalizeToken(raw: string): string | null {
  const token = raw.trim()
  if (!token) return null

  // Pull the code out of a pasted link (…/verify/IMP-XXXX) or use the token.
  const extracted = token.match(/\/verify\/([^/?#\s]+)/i)?.[1] ?? token
  let cleaned: string
  try {
    cleaned = decodeURIComponent(extracted)
  } catch {
    cleaned = extracted
  }
  cleaned = cleaned.replace(/[\s/]+$/, '').trim()
  if (!cleaned) return null

  const upper = cleaned.toUpperCase()
  const normalized = upper.startsWith('IMP-')
    ? upper
    : `IMP-${upper.replace(/^IMP-?/, '')}`
  return CODE_PATTERN.test(normalized) ? normalized : null
}

/** Split a pasted blob on whitespace, commas and semicolons, then normalize; de-dupe while keeping order. */
function parseCodes(raw: string): string[] {
  const seen = new Set<string>()
  const codes: string[] = []
  for (const token of raw.split(/[\s,;]+/)) {
    const code = normalizeToken(token)
    if (code && !seen.has(code)) {
      seen.add(code)
      codes.push(code)
    }
  }
  return codes
}

export default function VerifyLookupClient() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<Mode>('codes')
  const [pending, setPending] = useState<QrScanAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [bulkCodes, setBulkCodes] = useState<string[]>([])
  const router = useRouter()

  const detected = parseCodes(input)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPending(null)

    if (detected.length === 0) {
      setBulkCodes([])
      setError(
        'No IMP- codes found. Paste a code like IMP-A4F92B1C2D3E, a list, or a …/verify/IMP-XXXX link.'
      )
      return
    }
    if (detected.length > MAX_CODES) {
      setBulkCodes([])
      setError(`Please check at most ${MAX_CODES} codes at a time — you pasted ${detected.length}. Reduce to ${MAX_CODES} or fewer.`)
      return
    }

    setError(null)

    // Exactly one valid code → the full single-credential view.
    if (detected.length === 1) {
      setBulkCodes([])
      router.push(`/verify/${encodeURIComponent(detected[0])}`)
      return
    }

    // More than one → bulk table.
    setBulkCodes(detected)
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
          id="verify-tab-codes"
          aria-selected={mode === 'codes'}
          aria-controls="verify-panel-codes"
          tabIndex={mode === 'codes' ? 0 : -1}
          onClick={() => selectMode('codes')}
          onKeyDown={onTabKeyDown}
          className={tabClass('codes')}
        >
          Check codes
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
      </div>

      {mode === 'codes' ? (
        <div
          key="codes"
          id="verify-panel-codes"
          role="tabpanel"
          aria-labelledby="verify-tab-codes"
          className="space-y-6 motion-fade-in-up"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="verify-codes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IMP- verification code{detected.length > 1 ? 's' : ''}
              </label>
              <textarea
                id="verify-codes"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value.toUpperCase())
                  setError(null)
                  setBulkCodes([])
                }}
                rows={detected.length > 1 ? 6 : 3}
                spellCheck={false}
                autoComplete="off"
                placeholder={'IMP-A4F92B1C2D3E\n\nOr paste a whole class list — one code per line, or a …/verify/IMP-XXXX link.'}
                className="w-full font-mono text-sm rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 dark:bg-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                {detected.length === 0
                  ? 'Paste one code or a whole list — we detect which and check accordingly.'
                  : `${detected.length} code${detected.length === 1 ? '' : 's'} detected`}
                {detected.length > MAX_CODES && ` — reduce to ${MAX_CODES} or fewer`}
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400 motion-shake">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 motion-pressable"
            >
              {detected.length === 0
                ? 'Check code'
                : detected.length === 1
                  ? 'Look up credential'
                  : `Check ${detected.length} codes`}
            </button>
          </form>

          {bulkCodes.length > 1 && (
            <BulkVerifyPanel key={bulkCodes.join('\n')} codes={bulkCodes} />
          )}
        </div>
      ) : (
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
      )}
    </div>
  )
}
