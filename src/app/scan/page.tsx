import Link from 'next/link'
import Logo from '@/components/Logo'
import QrScanLauncher from '@/components/QrScanLauncher'

export const metadata = {
  title: 'Scan QR | ImpactMap',
  description: 'Scan event check-in, passport, or IMP- verification codes.',
}

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="flex justify-center">
          <Logo size="md" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quick scan</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Scan to verify credentials, join events, log hours, or check in volunteers.
          </p>
        </div>
        <QrScanLauncher label="Open scanner" className="w-full justify-center" />
        <div className="text-sm text-gray-500 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p>
            <Link href="/verify" className="text-emerald-700 hover:underline">
              Look up an IMP- code manually
            </Link>
          </p>
          <p>
            <Link href="/dashboard" className="text-emerald-700 hover:underline">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
