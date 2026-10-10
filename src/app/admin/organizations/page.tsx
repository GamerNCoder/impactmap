import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { isPlatformAdmin } from '@/lib/platform-admin'
import VerifyOrgButton from '@/components/VerifyOrgButton'
import SetOrgPlanTier from '@/components/SetOrgPlanTier'

export const metadata = {
  title: 'Organization Verification | ImpactMap Admin',
}

export default async function AdminOrganizationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/admin/organizations')
  if (!(await isPlatformAdmin(user.id))) notFound()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, location, verified, plan_tier, created_at')
    .order('created_at', { ascending: false })

  const unverified = (orgs ?? []).filter((o) => !o.verified)
  const verified = (orgs ?? []).filter((o) => o.verified)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organization verification</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Verify nonprofits and institutions for the verified badge on Growth and Enterprise plans.
          </p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Pending verification ({unverified.length})</h2>
          {unverified.length === 0 ? (
            <p className="text-sm text-gray-500">All organizations verified.</p>
          ) : (
            <ul className="space-y-3">
              {unverified.map((org) => (
                <li key={org.id} className="bg-white dark:bg-gray-900 border rounded-xl p-4 flex justify-between items-center gap-4">
                  <div>
                    <p className="font-medium">{org.name}</p>
                    {org.location && <p className="text-sm text-gray-500">{org.location}</p>}
                    <p className="text-xs text-gray-400 mt-1">Plan: {org.plan_tier ?? 'starter'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <SetOrgPlanTier organizationId={org.id} currentTier={org.plan_tier} />
                    <VerifyOrgButton organizationId={org.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Verified ({verified.length})</h2>
          <ul className="space-y-2">
            {verified.map((org) => (
              <li key={org.id} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                <span>{org.name}</span>
                <span className="text-emerald-600">✓ Verified</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
