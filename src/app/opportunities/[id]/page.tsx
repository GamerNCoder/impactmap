import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import JoinEventButton from '@/components/JoinEventButton'
import EventCheckInQr from '@/components/EventCheckInQr'
import TrackOnce from '@/components/TrackOnce'
import { APP_EVENTS } from '@/lib/app-events'
import { formatDate } from '@/lib/constants'
import { getEventWeather } from '@/lib/weather'
import NearTheEvent from '@/components/NearTheEvent'
import { getLocale } from '@/lib/locale'
import { getDictionary, localizeEvent, localizeEventTitle } from '@/lib/i18n'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const t = getDictionary(await getLocale())
  const supabase = await createClient()
  const { data } = await supabase.from('opportunities').select('title').eq('id', id).single()
  return {
    title: data ? `${localizeEventTitle(data.title, t)} | ImpactMap` : 'Opportunity | ImpactMap',
  }
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params
  const t = getDictionary(await getLocale())
  const supabase = await createClient()

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*, organizations(id, name, description, website, verified)')
    .eq('id', id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  const content = localizeEvent(opportunity, t)

  const org = opportunity.organizations as {
    id: string
    name: string
    description: string | null
    website: string | null
    verified: boolean
  } | null

  const { data: { user } } = await supabase.auth.getUser()

  let existingApplication = null
  let isHost = false
  if (user) {
    isHost = opportunity.posted_by === user.id

    const { data } = await supabase
      .from('applications')
      .select('status')
      .eq('opportunity_id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    existingApplication = data
  }

  const isJoined = existingApplication?.status === 'accepted' || existingApplication?.status === 'pending'
  const isFull =
    opportunity.volunteers_needed != null &&
    (opportunity.volunteers_count ?? 0) >= opportunity.volunteers_needed

  const weather = opportunity.remote
    ? null
    : await getEventWeather(opportunity.latitude, opportunity.longitude, opportunity.start_date)

  return (
    <div className="bg-gray-50 min-h-full">
      <TrackOnce
        event={APP_EVENTS.OPPORTUNITY_VIEW}
        organizationId={org?.id}
        resourceType="opportunity"
        resourceId={id}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/opportunities" className="text-emerald-700 hover:text-emerald-800 text-sm font-medium">
          ← {t.event.back}
        </Link>

        <div className="mt-6 grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-emerald-100 text-emerald-700 text-sm font-medium px-3 py-1 rounded-full">
                  {content.category}
                </span>
                {opportunity.remote && (
                  <span className="bg-violet-100 text-violet-800 text-sm font-medium px-3 py-1 rounded-full">
                    {t.event.online}
                  </span>
                )}
                <span className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full capitalize">
                  {opportunity.status === 'open' ? t.event.statusOpen : t.event.statusClosed}
                </span>
                {opportunity.wheelchair_accessible && (
                  <span className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full">{t.events.wheelchair}</span>
                )}
                {opportunity.accessible_restroom && (
                  <span className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full">{t.events.restroom}</span>
                )}
                {opportunity.sensory_friendly && (
                  <span className="bg-violet-100 text-violet-800 text-sm font-medium px-3 py-1 rounded-full">{t.events.sensory}</span>
                )}
                {opportunity.substance_free && (
                  <span className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">{t.events.substance}</span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>

              {org && (
                <Link
                  href={`/organizations/${org.id}`}
                  className="text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  {org.name}
                </Link>
              )}
              {org?.verified && (
                <span className="ml-2 text-xs font-semibold text-emerald-700" title={t.event.verified}>✓ {t.event.verified}</span>
              )}

              <div className="mt-6 prose prose-gray max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{content.description}</p>
              </div>

              {content.requirements && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.event.requirements}</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{content.requirements}</p>
                </div>
              )}

              {content.benefits && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.event.benefits}</h2>
                  <p className="text-gray-700 whitespace-pre-wrap">{content.benefits}</p>
                </div>
              )}

              {content.skills_required && content.skills_required.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.event.skills}</h2>
                  <div className="flex flex-wrap gap-2">
                    {content.skills_required.map((skill: string) => (
                      <span key={skill} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.event.details}</h2>
              <dl className="space-y-3 text-sm">
                {content.location?.trim() && (
                  <div>
                    <dt className="text-gray-500">{t.event.location}</dt>
                    <dd className="font-medium text-gray-900">{content.location}</dd>
                  </div>
                )}
                {opportunity.remote && (
                  <div>
                    <dt className="text-gray-500">{t.event.format}</dt>
                    <dd className="font-medium text-gray-900">{t.event.onlineEvent}</dd>
                  </div>
                )}
                {content.time_commitment && (
                  <div>
                    <dt className="text-gray-500">{t.event.time}</dt>
                    <dd className="font-medium text-gray-900">{content.time_commitment}</dd>
                  </div>
                )}
                {opportunity.start_date && (
                  <div>
                    <dt className="text-gray-500">{t.event.start}</dt>
                    <dd className="font-medium text-gray-900">{formatDate(opportunity.start_date, t.locale)}</dd>
                  </div>
                )}
                {opportunity.deadline && (
                  <div>
                    <dt className="text-gray-500">{t.event.applyBy}</dt>
                    <dd className="font-medium text-gray-900">{formatDate(opportunity.deadline, t.locale)}</dd>
                  </div>
                )}
                {opportunity.volunteers_needed != null && (
                  <div>
                    <dt className="text-gray-500">{t.event.needed}</dt>
                    <dd className="font-medium text-gray-900">
                      {opportunity.volunteers_count} / {opportunity.volunteers_needed} {t.event.filled}
                    </dd>
                  </div>
                )}
              </dl>

              {opportunity.facilities && opportunity.facilities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{t.event.facilities}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {opportunity.facilities.map((facility: string) => (
                      <li
                        key={facility}
                        className="bg-emerald-50 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {facility}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {weather && weather.risks.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-400">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{t.event.weather}</h2>
                <p className="text-xs text-gray-500 mb-3">
                  {formatDate(weather.date, t.locale)} · Open-Meteo forecast
                </p>
                <ul className="space-y-3">
                  {weather.risks.map((risk) => (
                    <li key={risk.label} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={`mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                          risk.level === 'warn' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        !
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{risk.label}</p>
                        <p className="text-sm text-gray-600">{risk.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-400 mt-3">
                  {t.event.weatherNote}
                </p>
              </div>
            )}

            {!opportunity.remote && opportunity.latitude != null && opportunity.longitude != null && (
              <NearTheEvent latitude={opportunity.latitude} longitude={opportunity.longitude} />
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.event.join}</h2>
              {!user ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">{t.event.signInBody}</p>
                  <Link
                    href={`/auth/login?next=/opportunities/${id}`}
                    className="inline-block bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-800"
                  >
                    {t.event.signIn}
                  </Link>
                </div>
              ) : (
                <>
                  <JoinEventButton
                    opportunityId={id}
                    opportunityTitle={content.title}
                    organizationId={opportunity.organization_id}
                    isJoined={isJoined}
                    isFull={isFull}
                    isOpen={opportunity.status === 'open'}
                    isHost={isHost}
                    dict={t}
                  />
                  {existingApplication && existingApplication.status === 'rejected' && (
                    <p className="mt-3 text-sm text-red-600">{t.event.rejected}</p>
                  )}
                </>
              )}
            </div>

            <EventCheckInQr opportunityId={id} title={content.title} dict={t} />
            <a
              href={`/api/opportunities/${id}/calendar`}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              <span aria-hidden>📅</span> {t.event.calendar}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
