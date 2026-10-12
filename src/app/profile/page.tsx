import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
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
  const { data } = await supabase.rpc('my_profile' as never)
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
      </div>
    </div>
  )
}
