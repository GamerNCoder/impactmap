import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateGroupForm from '@/components/CreateGroupForm'

export const metadata = {
  title: 'Groups | ImpactMap',
  description: 'Join or create volunteer groups on ImpactMap.',
}

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/groups')

  const [{ data: publicGroups }, { data: myMemberships }] = await Promise.all([
    supabase
      .from('community_groups')
      .select('*, profiles(full_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id),
  ])

  const myGroupIds = new Set((myMemberships ?? []).map((m) => m.group_id))

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <Link href="/community" className="text-sm text-emerald-600 hover:underline">← Community</Link>
            <h1 className="text-3xl font-bold mt-2">Volunteer groups</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Find your people and coordinate around causes you care about.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">Discover groups</h2>
            <div className="space-y-3">
              {(publicGroups ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No public groups yet.</p>
              ) : (
                (publicGroups ?? []).map((group) => (
                  <Link
                    key={group.id}
                    href={`/groups/${group.id}`}
                    className="block bg-white dark:bg-gray-900 rounded-xl border p-4 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        {group.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{group.description}</p>}
                        {group.category && <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">{group.category}</span>}
                      </div>
                      {myGroupIds.has(group.id) && (
                        <span className="text-xs text-emerald-600 font-medium">Joined</span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Create a group</h2>
            <CreateGroupForm />
          </section>
        </div>
      </div>
    </div>
  )
}
