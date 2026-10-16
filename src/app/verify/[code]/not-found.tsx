import Link from 'next/link'
import Logo from '@/components/Logo'

export default function InvalidCode() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md mx-auto text-center space-y-5">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-900 p-6">
          <p className="text-3xl" aria-hidden>🔍</p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-2">No hours found for that code</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            The code may be mistyped, or the organizer may not have approved those hours yet.
            Codes look like <span className="font-mono">IMP-A4F92B1C2D3E</span>, 12 characters after the dash.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/verify"
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 motion-pressable"
          >
            Try another code
          </Link>
          <Link href="/" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
            Go to ImpactMap
          </Link>
        </div>
      </div>
    </div>
  )
}
