import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogHoursForm from '@/components/LogHoursForm'
import { formatDate, statusColor, statusLabel } from '@/lib/constants'

export const metadata = {
  title: 'Dashboard | ImpactMap',
  description: 'Track your volunteer applications and logged hours.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: applications } = await supabase
    .from('applications')
    .select('*, opportunities(id, title, category, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select('*, opportunities(title)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const totalHours = (hours || []).reduce((sum, entry) => sum + Number(entry.hours), 0)
  const acceptedApps = (applications || []).filter((a) => a.status === 'accepted' || a.status === 'completed')

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 text-gray-600">Track your applications and volunteer impact.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Applications</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{applications?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Active roles</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{acceptedApps.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-sm text-gray-500">Total hours logged</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{totalHours.toFixed(1)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">My applications</h2>
              <Link href="/opportunities" className="text-indigo-600 text-sm font-medium hover:text-indigo-800">
                Browse more →
              </Link>
            </div>

            {applications && applications.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const opp = app.opportunities as { id: string; title: string; category: string } | null
                  return (
                    <li key={app.id} className="py-4 first:pt-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          {opp ? (
                            <Link
                              href={`/opportunities/${opp.id}`}
                              className="font-medium text-gray-900 hover:text-indigo-600"
                            >
                              {opp.title}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">Unknown opportunity</span>
                          )}
                          {opp && <p className="text-sm text-gray-500 mt-1">{opp.category}</p>}
                          <p className="text-xs text-gray-400 mt-1">Applied {formatDate(app.created_at.split('T')[0])}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded capitalize ${statusColor(app.status)}`}>
                          {statusLabel(app.status)}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No applications yet.{' '}
                <Link href="/opportunities" className="text-indigo-600 hover:underline">Find an opportunity</Link>
              </p>
            )}
          </section>

          <section className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Log volunteer hours</h2>

            {acceptedApps.length > 0 ? (
              <div className="space-y-6">
                {acceptedApps.map((app) => {
                  const opp = app.opportunities as { id: string; title: string } | null
                  if (!opp) return null
                  return (
                    <div key={app.id} className="border border-gray-100 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">{opp.title}</h3>
                      <LogHoursForm opportunityId={opp.id} opportunityTitle={opp.title} />
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Log hours once an application is accepted.
              </p>
            )}
          </section>
        </div>

        {hours && hours.length > 0 && (
          <section className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Hours history</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Opportunity</th>
                    <th className="pb-3 font-medium">Hours</th>
                    <th className="pb-3 font-medium">Notes</th>
                    <th className="pb-3 font-medium">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hours.map((entry) => {
                    const opp = entry.opportunities as { title: string } | null
                    return (
                      <tr key={entry.id}>
                        <td className="py-3">{formatDate(entry.date)}</td>
                        <td className="py-3">{opp?.title || '—'}</td>
                        <td className="py-3 font-medium">{entry.hours}</td>
                        <td className="py-3 text-gray-500">{entry.description || '—'}</td>
                        <td className="py-3">
                          {entry.verified ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-400">Pending</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
