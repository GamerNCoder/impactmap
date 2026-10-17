'use client'

import { useState } from 'react'

/** Read the filename the export route chose, so the saved file keeps its dated name. */
function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null
  const match = /filename="?([^";]+)"?/i.exec(header)
  return match?.[1] ?? null
}

export default function DownloadMyData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    setDone(false)

    try {
      const res = await fetch('/api/me/export', { headers: { Accept: 'application/json' } })

      if (res.status === 401) {
        throw new Error('Your session expired. Sign in again and retry.')
      }
      if (!res.ok) {
        throw new Error('We could not build your export. Nothing was changed — please try again in a moment.')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download =
        filenameFromDisposition(res.headers.get('Content-Disposition')) ??
        `impactmap-my-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setDone(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not download your data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Get a copy of what we hold about you as a JSON file: your profile (including the private fields only you can
        see, like your birthday, phone and guardian details), every hour you logged, your event applications and your
        QR check-ins. Nothing is changed by downloading it.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {done && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200"
        >
          Your file is on its way — check your browser&rsquo;s downloads. If nothing happened, use the raw JSON link
          below.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Building your file…' : 'Download my data'}
        </button>
        <a
          href="/api/me/export"
          className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Or open the raw JSON
        </a>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Read about your rights in the <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </div>
  )
}
