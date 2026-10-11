import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from '@/components/OnboardingWizard'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Set up your profile | ImpactMap',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/onboarding')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, location, skills')
    .eq('id', user.id)
    .single()

  if (profile?.skills && profile.skills.length > 0) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="p-6">
        <Logo />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl p-8">
          <OnboardingWizard
            initialName={profile?.full_name ?? ''}
            initialLocation={profile?.location ?? ''}
          />
        </div>
      </main>
    </div>
  )
}
