import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import JoinGroupButton from '@/components/JoinGroupButton'
import SharePostForm from '@/components/SharePostForm'
import { NewThreadForm } from '@/components/ForumForms'
import { formatDate } from '@/lib/constants'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/groups/${id}`)

  const { data: group } = await supabase
    .from('community_groups')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (!group) notFound()

  const [{ data: membership }, { data: members }, { data: posts }, { data: threads }] = await Promise.all([
    supabase.from('group_members').select('role').eq('group_id', id).eq('user_id', user.id).maybeSingle(),
    supabase.from('group_members').select('*, profiles(full_name)').eq('group_id', id).order('joined_at'),
    supabase.from('shared_posts').select('*, profiles(full_name)').eq('group_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('forum_threads').select('*, profiles(full_name)').eq('group_id', id).order('updated_at', { ascending: false }).limit(10),
  ])

  const isMember = !!membership
  const canView = group.is_public || isMember

  if (!canView) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Private group</h1>
        <p className="text-gray-600 mt-2">You need an invitation to view this group.</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-violet-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/groups" className="text-sm text-violet-200 hover:underline">← All groups</Link>
          <h1 className="text-3xl font-bold mt-2">{group.name}</h1>
          {group.description && <p className="mt-2 text-violet-100">{group.description}</p>}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {group.category && <span className="text-sm bg-white/10 px-3 py-1 rounded-full">{group.category}</span>}
            <span className="text-sm text-violet-200">{members?.length ?? 0} members</span>
            {!isMember && group.is_public && <JoinGroupButton groupId={id} isMember={false} />}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {isMember && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Share with group</h2>
              <SharePostForm groupId={id} />
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-4">Group feed</h2>
            <div className="space-y-4">
              {(posts ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No posts in this group yet.</p>
              ) : (
                (posts ?? []).map((post) => (
                  <article key={post.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{post.profiles?.full_name ?? 'Member'}</span>
                      <span className="text-gray-400">{post.created_at ? formatDate(post.created_at) : ''}</span>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{post.body}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          {isMember && (
            <section className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <h2 className="text-lg font-semibold mb-4">Group forum</h2>
              <NewThreadForm groupId={id} />
              <ul className="mt-4 space-y-2">
                {(threads ?? []).map((thread) => (
                  <li key={thread.id}>
                    <Link href={`/community/forum/${thread.id}`} className="text-sm font-medium text-emerald-600 hover:underline">
                      {thread.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-4">Members</h2>
            <ul className="space-y-2">
              {(members ?? []).map((m) => (
                <li key={m.id} className="flex justify-between text-sm">
                  <Link href={`/volunteers/${m.user_id}`} className="hover:text-emerald-600">
                    {m.profiles?.full_name ?? 'Member'}
                  </Link>
                  <span className="text-xs text-gray-400">{m.role}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
