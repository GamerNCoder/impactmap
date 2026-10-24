import Link from 'next/link'
import { DEMO_VERIFICATION_CODE, demoEnabled } from '@/lib/demo'

export const metadata = {
  title: 'Live demo | ImpactMap',
  description:
    'Explore the student and organizer views of ImpactMap with real demo data — no signup required.',
}

export const dynamic = 'force-dynamic'

const ERROR_MESSAGES: Record<string, string> = {
  disabled: 'The demo is not configured on this deployment yet.',
  unavailable: 'The demo accounts are not ready yet. Try again after the next deploy.',
  unknown: 'That demo view does not exist.',
}

type PageProps = {
  searchParams: Promise<{ error?: string; reset?: string }>
}

export default async function DemoPage({ searchParams }: PageProps) {
  const { error, reset } = await searchParams
  const enabled = demoEnabled()

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
          Live demo
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          See the whole loop, no signup.
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Pick a role. The student view already has verified hours, a pending log and a counselor
          report; the organizer view has that log waiting for one-tap approval.
        </p>

        {reset === '1' && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-200"
          >
            Demo restored. The pending 2-hour log is ready to approve again.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
          >
            {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
          </div>
        )}

        {enabled ? (
          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            <Link
              href="/demo/student"
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all motion-pressable"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xl">
                🎓
              </span>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Student view</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Open the dashboard, passport, printable report and a real <code>IMP-</code> code.
              </p>
              <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Open the student demo →
              </p>
            </Link>
            <Link
              href="/demo/organizer"
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md transition-all motion-pressable"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xl">
                ✅
              </span>
              <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Organizer view</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                See attendance, then approve a pending 2-hour log and watch the code get issued.
              </p>
              <p className="mt-4 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Open the organizer demo →
              </p>
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 p-6 text-amber-900 dark:text-amber-200">
            <p className="font-semibold">Demo not configured</p>
            <p className="mt-1 text-sm">
              This deployment is missing the demo account environment variables. You can still{' '}
              <Link href="/auth/signup" className="underline">
                create a free account
              </Link>{' '}
              or{' '}
              <Link href="/verify" className="underline">
                check a code
              </Link>
              .
            </p>
          </div>
        )}

        {enabled && (
          <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white">Reset the demo</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              If a previous visitor already approved the pending log, restore it here. Verified demo
              hours and the demo events stay unchanged.
            </p>
            <form action="/api/demo/reset" method="post" className="mt-4">
              <button
                type="submit"
                className="rounded-xl border border-emerald-700 text-emerald-800 dark:text-emerald-300 px-4 py-2 text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
              >
                Reset the demo data
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="font-semibold text-gray-900 dark:text-white">What you can try</h2>
          <ul className="mt-3 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>• View a verified service record and hours goal</li>
            <li>• Print the counselor report with QR codes</li>
            <li>• Approve a pending log as the organizer</li>
            <li>• Check a real code with no account</li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          The demo organization and its events are fictional. These are shared demo accounts; feel
          free to click around. Data may be changed by other visitors and is reset when the demo is
          refreshed.{' '}
          <Link
            href={`/verify/${DEMO_VERIFICATION_CODE}`}
            className="font-semibold text-emerald-700 dark:text-emerald-400 underline underline-offset-2"
          >
            Check the demo code →
          </Link>
        </p>
      </div>
    </div>
  )
}
