import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import CheckInLocation from '@/components/CheckInLocation'
import { formatDate } from '@/lib/constants'
import { getLocale } from '@/lib/locale'
import { getDictionary } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const t = getDictionary(await getLocale())
  const supabase = await createClient()
  const { data } = await supabase.from('opportunities').select('title').eq('id', id).maybeSingle()
  return {
    title: data ? `Check in · ${data.title} | ImpactMap` : 'Check in | ImpactMap',
    description: 'Record that you attended a volunteer event.',
  }
}

export default async function CheckInPage({ params }: PageProps) {
  const { id } = await params
  const t = getDictionary(await getLocale())
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=/checkin/${id}`)
  }

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, title, start_date, location, remote, organizations(name)')
    .eq('id', id)
    .maybeSingle()

  if (!opportunity) {
    notFound()
  }

  // Idempotent: scanning twice is not an error, it just reports "already".
  const { data: result } = await supabase.rpc(
    'check_in_event',
    { p_opportunity_id: id }
  )
  const outcome = (result ?? {}) as { ok?: boolean; already?: boolean; error?: string }

  const { data: application } = await supabase
    .from('applications')
    .select('status')
    .eq('opportunity_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const joined = ['pending', 'accepted', 'completed'].includes(application?.status ?? '')
  const org = opportunity.organizations as unknown as { name: string } | null

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-emerald-700 text-white px-6 py-5">
            <p className="text-emerald-50 text-sm font-medium">
              {outcome.already ? 'Already checked in' : 'Checked in'}
            </p>
            <h1 className="text-2xl font-bold mt-1">{opportunity.title}</h1>
            {org?.name && <p className="text-emerald-50 text-sm mt-1">{org.name}</p>}
          </div>

          <div className="p-6 space-y-5">
            {!outcome.ok ? (
              <div role="alert" className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-xl p-4 text-sm">
                We could not record your check-in. Your attendance is not lost — tell the organizer at
                the sign-in table, and you can still log your hours afterwards.
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {outcome.already
                  ? 'You had already checked in to this event. The organizer can see that you attended.'
                  : 'The organizer can now see that you attended.'}
              </p>
            )}

            {!opportunity.remote && outcome.ok && (
              <CheckInLocation opportunityId={id} dict={t} />
            )}

            <dl className="grid grid-cols-2 gap-4 text-sm">
              {opportunity.start_date && (
                <div>
                  <dt className="text-gray-500">Date</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {formatDate(opportunity.start_date)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Where</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {opportunity.remote ? 'Online event' : opportunity.location || '—'}
                </dd>
              </div>
            </dl>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Next: log your hours</p>
              {joined ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Log the time you spent so the organizer can approve it. Each approval gives you a
                    code your counselor can check.
                  </p>
                  <Link
                    href={`/dashboard?opportunity=${id}`}
                    className="inline-flex w-full justify-center py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 motion-pressable"
                  >
                    Log my hours
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You are checked in but not signed up for this event yet. Join it first, then you can
                    log your hours.
                  </p>
                  <Link
                    href={`/opportunities/${id}`}
                    className="inline-flex w-full justify-center py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 motion-pressable"
                  >
                    Join this event
                  </Link>
                </>
              )}
              <Link
                href={`/opportunities/${id}`}
                className="inline-flex w-full justify-center py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Back to the event
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Check-in is only visible to the event&rsquo;s organizers.
        </p>
      </div>
    </div>
  )
}
