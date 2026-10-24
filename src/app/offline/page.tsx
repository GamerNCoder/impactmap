import Link from 'next/link'

export const metadata = {
  title: 'Offline | ImpactMap',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] bg-gray-50 dark:bg-gray-950 py-16 px-4">
      <div className="max-w-xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">You&rsquo;re offline</h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          ImpactMap can queue a check-in on this device, but event pages, approval, and verification need a connection.
          Reconnect and try again; queued check-ins sync automatically.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
          Try again
        </Link>
      </div>
    </div>
  )
}
