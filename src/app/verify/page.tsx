import Link from 'next/link'
import Logo from '@/components/Logo'
import VerifyLookupClient from '@/components/VerifyLookupClient'

export const metadata = {
  title: 'Verify credential | ImpactMap',
  description: 'Scan or enter an IMP- code to verify volunteer credentials.',
}

export default function VerifyLookupPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verify a credential</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Schools, employers, and funders can confirm verified hours and completions instantly.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
          <VerifyLookupClient />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/scan" className="text-emerald-600 hover:underline">
            Open full scanner
          </Link>
          {' · '}
          <Link href="/" className="text-emerald-600 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  )
}
