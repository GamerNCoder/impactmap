'use client'

import { useState } from 'react'
import Link from 'next/link'
import PrintButton from '@/components/PrintButton'

type Row = {
  code: string
  status: 'verified' | 'unknown' | 'invalid'
  name: string | null
  event: string | null
  organization: string | null
  date: string | null
  hours: number | null
  approver: string | null
  type: 'hours' | 'completion' | null
}

const MAX_CODES = 200

function parseCodes(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((c) => c.trim())
    .filter(Boolean)
}

export default function BulkVerifyPanel() {
  const [raw, setRaw] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [summary, setSummary] = useState<{ checked: number; verified: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codes = parseCodes(raw)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (codes.length === 0) {
      setError('Paste at least one IMP- code.')
      return
    }
    if (codes.length > MAX_CODES) {
      setError(`Please check at most ${MAX_CODES} codes at a time — you pasted ${codes.length}.`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/verify/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      })
      const data = (await res.json()) as {
        results?: Row[]
        summary?: { checked: number; verified: number }
        error?: string
      }
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed')
      setRows(data.results ?? [])
      setSummary(data.summary ?? null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  const unknown = (rows ?? []).filter((r) => r.status !== 'verified')

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="bulk-codes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IMP- verification codes
          </label>
          <textarea
            id="bulk-codes"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={'IMP-A4F92B1C2D3E\nIMP-7C41A9E2B0D3\n\nPaste a whole class list, one per line.'}
            className="w-full font-mono text-sm rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 dark:bg-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            {codes.length} code{codes.length === 1 ? '' : 's'} detected
            {codes.length > MAX_CODES && ` — reduce to ${MAX_CODES} or fewer`}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
        >
          {loading ? 'Checking…' : codes.length > 0 ? `Check ${codes.length} code${codes.length === 1 ? '' : 's'}` : 'Check codes'}
        </button>
      </form>

      {summary && rows && (
        <section className="space-y-4 motion-fade-in-up">
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4"
          >
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              {summary.verified} of {summary.checked} code{summary.checked === 1 ? '' : 's'} verified
            </p>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 mt-1">
              Each verified row was approved by the named event organizer. Codes are issued only on approval —
              students cannot create or edit them.
            </p>
          </div>

          {unknown.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Not verified ({unknown.length})
              </p>
              <p className="font-mono text-xs text-amber-900 dark:text-amber-200 mt-1 break-all">
                {unknown.map((u) => u.code).join(', ')}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                These are either mistyped, or the organizer has not approved those hours yet.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">Bulk verification results</caption>
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-300 dark:border-gray-700">
                  <th scope="col" className="py-2 pr-3 font-semibold">Status</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Volunteer</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Event</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Date</th>
                  <th scope="col" className="py-2 pr-3 font-semibold text-right">Hours</th>
                  <th scope="col" className="py-2 pr-3 font-semibold hidden sm:table-cell">Approved by</th>
                  <th scope="col" className="py-2 font-semibold">Code</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.code} className="border-b border-gray-200 dark:border-gray-800 align-top">
                    <td className="py-2 pr-3">
                      {r.status === 'verified' ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">{r.name ?? '—'}</td>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">
                      {r.event ?? '—'}
                      {r.organization && (
                        <span className="block text-gray-500 text-xs">{r.organization}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{r.date ?? '—'}</td>
                    <td className="py-2 pr-3 text-right text-gray-900 dark:text-white">
                      {r.hours ?? (r.type === 'completion' ? 'task' : '—')}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                      {r.approver ?? '—'}
                    </td>
                    <td className="py-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                      {r.status === 'verified' ? (
                        <Link href={`/verify/${r.code}`} className="text-emerald-700 dark:text-emerald-400 hover:underline">
                          {r.code}
                        </Link>
                      ) : (
                        r.code
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="print:hidden">
            <PrintButton />
          </div>
        </section>
      )}
    </div>
  )
}
