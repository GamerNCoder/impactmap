import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/locale'
import { getDictionary, localizeEventTitle } from '@/lib/i18n'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/constants'
import SharePassportButton from '@/components/SharePassportButton'
import HoursGoal from '@/components/HoursGoal'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'
import { getServiceRecord } from '@/lib/service-record'

export const metadata = {
  title: 'My hours | ImpactMap',
  description: 'Your verified volunteer hours and the codes your counselor can check.',
}

export default async function PassportPage() {
  const t = getDictionary(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/passport')
  }

  const record = await getServiceRecord(supabase, user.id)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <TrackOnce event={APP_EVENTS.PASSPORT_VIEW} />
      <div className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">My hours</p>
          <h1 className="text-3xl font-bold mt-1">{record.name}</h1>
          <p className="text-5xl font-extrabold mt-6">
            {record.verifiedHours.toFixed(1)}
            <span className="text-xl font-semibold text-emerald-100 ml-2">verified hours</span>
          </p>
          <div className="mt-6">
            <HoursGoal userId={user.id} verifiedHours={record.verifiedHours} goal={record.goal} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/passport/report"
              className="bg-white text-emerald-800 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-50"
            >
              📄 Counselor report (print / PDF)
            </Link>
            <SharePassportButton volunteerId={user.id} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Verified</h2>
          <p className="text-sm text-gray-500 mb-4">Each code can be checked by anyone at impactmap.vercel.app/verify.</p>
          {record.verified.length > 0 ? (
            <ul className="space-y-3">
              {record.verified.map((r) => (
                <li key={r.code} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-emerald-500 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{localizeEventTitle(r.event, t)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{r.organization}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {r.hours != null ? `${r.hours}h · ` : ''}{r.date ? formatDate(r.date) : ''}
                        {r.approver && ` · approved by ${r.approver}`}
                      </p>
                    </div>
                    <Link href={`/verify/${r.code}`} target="_blank" className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                      {r.code}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-600 dark:text-gray-400">
              <p>No verified hours yet.</p>
              <p className="text-sm mt-2">Join an event, then log your hours from Home. The organizer approves them.</p>
              <Link href="/opportunities" className="inline-block mt-4 text-emerald-700 font-medium hover:underline">
                Find an event →
              </Link>
            </div>
          )}
        </section>

        {record.pending.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Waiting for the organizer</h2>
            <ul className="space-y-3">
              {record.pending.map((p) => (
                <li key={p.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 border-l-4 border-l-amber-400 p-4">
                  <p className="font-medium text-gray-900 dark:text-white">{localizeEventTitle(p.event, t)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {p.hours}h on {formatDate(p.date)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
