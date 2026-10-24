import Link from 'next/link'
import { isDemoEmail } from '@/lib/demo'

/** Shown only on the shared demo accounts, so a judge knows edits are not private. */
export default function DemoNotice({ email }: { email?: string | null }) {
  if (!isDemoEmail(email)) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold">Demo account.</span>
        <span>Feel free to click around — data is shared and may reset.</span>
        <Link href="/demo" className="font-semibold underline underline-offset-2">
          Other demo view →
        </Link>
      </div>
    </div>
  )
}
