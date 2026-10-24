import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import DownloadMyData from '@/components/DownloadMyData'
import DeleteAccountForm from '@/components/DeleteAccountForm'
import type { Database } from '@/types/database'

export const metadata = {
  title: 'Profile | ImpactMap',
}

type Profile = Database['public']['Tables']['profiles']['Row']

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Private fields (email, birthday, guardian) are only readable through my_profile().
  const { data } = await supabase.rpc('my_profile')
  const profile = ((data as unknown as Profile[] | null) ?? [])[0] ?? null

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Organizers only see your name.</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <ProfileForm profile={profile} userEmail={user.email || ''} />
        </div>

        <section aria-labelledby="your-data" className="pt-4 space-y-6">
          <div>
            <h2 id="your-data" className="text-2xl font-bold text-gray-900 dark:text-white">
              Your data
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Take a copy of your data with you, or close your account for good.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-emerald-200 dark:border-emerald-900 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Download your data</h3>
            <p className="mt-1 mb-4 text-sm text-emerald-800 dark:text-emerald-300">
              Yours to keep, in a machine-readable file.
            </p>
            <DownloadMyData />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-red-300 dark:border-red-900 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Delete your account</h3>
            <p className="mt-1 mb-4 text-sm text-red-700 dark:text-red-400">
              Permanent. This cannot be undone.
            </p>
            <DeleteAccountForm />
          </div>
        </section>
      </div>
    </div>
  )
}
