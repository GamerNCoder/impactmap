import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/constants'
import { getServiceRecord } from '@/lib/service-record'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', id).maybeSingle()
  return {
    title: profile?.full_name ? `${profile.full_name} · verified hours | ImpactMap` : 'Verified hours | ImpactMap',
    description: 'Volunteer hours approved by event organizers on ImpactMap.',
  }
}

// Public, shareable record: only organizer-approved hours (RLS hides everything else).
export default async function PublicVolunteerPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exists } = await supabase.from('profiles').select('id').eq('id', id).maybeSingle()
  if (!exists) notFound()

  const record = await getServiceRecord(supabase, id)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <TrackOnce event={APP_EVENTS.PASSPORT_VIEW} />
      <div className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-emerald-100 text-sm font-medium uppercase tracking-wide">Verified volunteer hours</p>
          <h1 className="text-3xl font-bold mt-1">{record.name}</h1>
          <p className="text-5xl font-extrabold mt-6">
            {record.verifiedHours.toFixed(1)}
            <span className="text-xl font-semibold text-emerald-100 ml-2">hours</span>
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {record.verified.length > 0 ? (
          <ul className="space-y-3">
            {record.verified.map((r) => (
              <li key={r.code} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{r.event}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {r.organization}
                    {r.hours != null && ` · ${r.hours}h`}
                    {r.date && ` · ${formatDate(r.date)}`}
                  </p>
                  {r.approver && <p className="text-xs text-gray-500 mt-1">Approved by {r.approver}</p>}
                </div>
                <Link href={`/verify/${r.code}`} className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                  {r.code}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No verified hours yet.</p>
        )}
        <p className="text-xs text-gray-500 mt-6">
          Each code was issued when an event organizer approved the hours. Tap a code to check it.
        </p>
      </div>
    </div>
  )
}
