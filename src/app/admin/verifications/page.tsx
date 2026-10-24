import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import VerificationRequestActions from '@/components/VerificationRequestActions'

export const metadata = { title: 'Verification requests | ImpactMap' }

export default async function AdminVerificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/verifications')

  const { data: isAdmin } = await supabase.rpc('is_platform_admin')
  if (!isAdmin) notFound()

  const { data: requests } = await supabase
    .from('verification_requests')
    .select('id, organization_id, message, status, created_at, organizations(name)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Verification requests</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Approve only organizations you can confirm. Approval flips their public verified badge.
        </p>
        {!requests?.length ? (
          <p className="mt-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 text-sm text-gray-500">
            No pending requests.
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {requests.map((req) => (
              <li key={req.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {(req.organizations as { name?: string } | null)?.name ?? 'Organization'}
                </p>
                {req.message && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{req.message}</p>}
                <div className="mt-4">
                  <VerificationRequestActions requestId={req.id} organizationId={req.organization_id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
