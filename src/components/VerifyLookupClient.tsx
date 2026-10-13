'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import QrScanner from '@/components/QrScanner'
import {
  describeScanAction,
  parseQrScan,
  routeForScanAction,
  type QrScanAction,
} from '@/lib/qr-scan'

export default function VerifyLookupClient() {
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'form' | 'scan'>('form')
  const [pending, setPending] = useState<QrScanAction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const goToCode = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      setError('Enter or scan an IMP- verification code.')
      return
    }
    const normalized = trimmed.toUpperCase().startsWith('IMP-')
      ? trimmed.toUpperCase()
      : `IMP-${trimmed.replace(/^IMP-?/i, '').toUpperCase()}`
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

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <button
          type="button"
          onClick={() => { setMode('form'); setPending(null); setError(null) }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 motion-pressable ${
            mode === 'form'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Enter code
        </button>
        <button
          type="button"
          onClick={() => { setMode('scan'); setPending(null); setError(null) }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 motion-pressable ${
            mode === 'scan'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Scan QR
        </button>
      </div>

      {mode === 'form' ? (
        <form
          key="form"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 motion-pressable"
          >
            Look up credential
          </button>
        </form>
      ) : (
        <div key="scan" className="space-y-4 motion-fade-in-up">
          {!pending ? (
            <>
              <QrScanner onScan={handleScan} onError={setError} />
              {error && <p className="text-sm text-red-600 motion-shake">{error}</p>}
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
