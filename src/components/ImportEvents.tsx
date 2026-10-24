'use client'

import { useState } from 'react'
import { importEvents, type ImportEventRow } from '@/app/actions/import-events'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'

const HEADER = ['title', 'category', 'start_date', 'location', 'volunteers_needed', 'wheelchair_accessible', 'substance_free']
const TEMPLATE = [
  HEADER.join(','),
  'Food pantry shift,Community Service,2026-11-14T17:00:00-05:00,Edison Community Center,8,true,true',
  'Trail cleanup,Environment,2026-11-21T09:00:00-05:00,Roosevelt Park,20,true,true',
].join('\n')

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((v) => v.trim()))
}

export default function ImportEvents({ organizationId }: { organizationId: string }) {
  const [rows, setRows] = useState<ImportEventRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const onFile = async (file: File | undefined) => {
    setError(null)
    setMessage(null)
    setRows([])
    setFileName(file?.name ?? null)
    if (!file) return
    const text = await file.text()
    const table = parseCsv(text)
    if (table.length < 2) { setError('The file needs a header row and at least one event.'); return }
    const header = table[0].map((h) => h.trim().toLowerCase())
    if (HEADER.some((h) => !header.includes(h))) {
      setError(`Header must include: ${HEADER.join(', ')}`)
      return
    }
    const index = Object.fromEntries(header.map((h, i) => [h, i]))
    const parsed: ImportEventRow[] = []
    for (const [rowIndex, row] of table.slice(1).entries()) {
      const value = (key: string) => row[index[key]]?.trim() ?? ''
      const category = value('category')
      const date = new Date(value('start_date'))
      if (!OPPORTUNITY_CATEGORIES.includes(category as never)) {
        setError(`Row ${rowIndex + 2}: category “${category}” is not recognized.`)
        return
      }
      if (!value('title') || Number.isNaN(date.getTime())) {
        setError(`Row ${rowIndex + 2}: title and start_date are required.`)
        return
      }
      parsed.push({
        title: value('title'),
        category,
        start_date: date.toISOString(),
        location: value('location'),
        volunteers_needed: Number(value('volunteers_needed') || '1'),
        wheelchair_accessible: /^(1|true|yes)$/i.test(value('wheelchair_accessible')),
        substance_free: /^(1|true|yes)$/i.test(value('substance_free')),
      })
    }
    setRows(parsed)
  }

  const run = async () => {
    setLoading(true)
    setError(null)
    const result = await importEvents(organizationId, rows)
    setLoading(false)
    if ('error' in result && result.error) { setError(result.error); return }
    setMessage(`Imported ${result.count} event${result.count === 1 ? '' : 's'}.`)
    setRows([])
  }

  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import events from a CSV</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          The file must start with: <code className="text-xs">{HEADER.join(', ')}</code>. Nothing is written until you confirm the preview.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
          Choose CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`}
          download="impactmap-events-template.csv"
          className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
        >
          Download template
        </a>
        {fileName && <span className="text-xs text-gray-500">{fileName}</span>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>}
      {rows.length > 0 && (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-300">Detected {rows.length} event{rows.length === 1 ? '' : 's'}:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Starts</th>
                  <th className="py-2 pr-4">Location</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={`${row.title}-${i}`} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4">{row.title}</td>
                    <td className="py-2 pr-4">{row.category}</td>
                    <td className="py-2 pr-4">{new Date(row.start_date).toLocaleDateString()}</td>
                    <td className="py-2 pr-4">{row.location || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? 'Importing…' : `Import ${rows.length} event${rows.length === 1 ? '' : 's'}`}
          </button>
        </>
      )}
    </section>
  )
}
