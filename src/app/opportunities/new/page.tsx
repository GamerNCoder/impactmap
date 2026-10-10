import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateEventForm from '@/components/CreateEventForm'

export const metadata = {
  title: 'Post an Event | ImpactMap',
  description: 'Create a volunteer event and invite people to join.',
}

export default async function NewOpportunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/opportunities/new')
  }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(id, name)')
    .eq('user_id', user.id)

  const memberOrgs = (memberships ?? [])
    .map((m) => {
      const org = m.organizations as unknown as { id: string; name: string } | null
      return org ? { id: org.id, name: org.name } : null
    })
    .filter(Boolean) as { id: string; name: string }[]

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/opportunities" className="text-indigo-600 text-sm hover:underline">
            ← Back to events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Post a volunteer event</h1>
          <p className="mt-2 text-gray-600">
            Publish an event anyone can discover and join with one click.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CreateEventForm memberOrgs={memberOrgs} />
      </div>
    </div>
  )
}
