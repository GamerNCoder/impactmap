'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PrintButton from '@/components/PrintButton'

type Row = {
  code: string
  status: 'verified' | 'revoked' | 'unknown' | 'invalid'
  name: string | null
  event: string | null
  organization: string | null
  organizer_verified: boolean | null
  date: string | null
  hours: number | null
  approver: string | null
  type: 'hours' | 'completion' | null
}

type Props = {
  /** Normalized IMP- codes to check. An empty list clears the results. */
  codes: string[]
}

/**
 * Results view for a batch of codes. The caller owns the merged input and
 * decides single vs. batch; this component only renders the summary, the
 * explicit not-verified list, the table and the print button.
 */
export default function BulkVerifyPanel({ codes }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [summary, setSummary] = useState<{ checked: number; verified: number; revoked?: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // A stable key so a new list re-runs the request, but a re-render does not.
  // The caller mounts a fresh panel per batch (keyed), so the effect only
  // needs to run the request — never to clear state synchronously.
  const codesKey = codes.join('\n')

  useEffect(() => {
    const list = codesKey.split('\n')
    const controller = new AbortController()
    let cancelled = false

    const run = async () => {
      try {
        const res = await fetch('/api/verify/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codes: list }),
          signal: controller.signal,
        })
        const data = (await res.json()) as {
          results?: Row[]
          summary?: { checked: number; verified: number; revoked?: number }
          error?: string
        }
        if (cancelled) return
        if (!res.ok) throw new Error(data.error ?? 'Lookup failed')
        setRows(data.results ?? [])
        setSummary(data.summary ?? null)
      } catch (err: unknown) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return
        setRows(null)
        setSummary(null)
        setError(err instanceof Error ? err.message : 'Lookup failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [codesKey])

  const revoked = (rows ?? []).filter((r) => r.status === 'revoked')
  const unknown = (rows ?? []).filter((r) => r.status !== 'verified' && r.status !== 'revoked')
  const unverifiedOrganizers = (rows ?? []).filter((r) => r.status === 'verified' && r.organizer_verified === false)

  return (
    <div className="space-y-6">
      {loading && (
        <p role="status" aria-live="polite" className="text-sm text-gray-600 dark:text-gray-400">
          Checking {codes.length} code{codes.length === 1 ? '' : 's'}…
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

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

          {unverifiedOrganizers.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {unverifiedOrganizers.length} verified row{unverifiedOrganizers.length === 1 ? '' : 's'} came from an unverified organizer
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                The code records the organizer&rsquo;s attestation. ImpactMap has not verified that organization.
              </p>
            </div>
          )}

          {revoked.length > 0 && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-200">
                Revoked by the organizer ({revoked.length})
              </p>
              <p className="font-mono text-xs text-red-900 dark:text-red-200 mt-1 break-all">
                {revoked.map((u) => u.code).join(', ')}
              </p>
              <p className="text-xs text-red-800 dark:text-red-300 mt-2">
                The organizer withdrew these approvals. They are not valid credentials and are
                excluded from the student&rsquo;s totals and the public impact page.
              </p>
            </div>
          )}

          {unknown.length > 0 && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Not verified ({unknown.length})
              </p>
              <p className="font-mono text-xs text-amber-900 dark:text-amber-200 mt-1 break-all">
                {unknown.map((u) => u.code).join(', ')}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-2">
                These are either mistyped, expired, or the organizer has not approved those hours yet.
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
                      ) : r.status === 'revoked' ? (
                        <span className="text-red-700 dark:text-red-300 font-semibold">Revoked</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">{r.name ?? '—'}</td>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">
                      {r.event ?? '—'}
                      {r.organization && (
                        <span className="block text-gray-500 text-xs">
                          {r.organization}
                          {r.organizer_verified === false && (
                            <span className="ml-1 text-amber-700 dark:text-amber-400 font-medium">· unverified organizer</span>
                          )}
                        </span>
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
                      {r.status === 'verified' || r.status === 'revoked' ? (
                        <Link
                          href={`/verify/${r.code}`}
                          className={`hover:underline ${r.status === 'revoked' ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-400'}`}
                        >
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
