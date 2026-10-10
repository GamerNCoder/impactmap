import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SharePostForm from '@/components/SharePostForm'
import { NewThreadForm } from '@/components/ForumForms'
import { formatDate } from '@/lib/constants'
import ShareLinkButton from '@/components/ShareLinkButton'

export const metadata = {
  title: 'Community | ImpactMap',
  description: 'Connect with volunteers — share updates, join discussions, and build groups.',
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/community')

  const [{ data: posts }, { data: threads }, { data: groups }] = await Promise.all([
    supabase
      .from('shared_posts')
      .select('*, profiles(full_name)')
      .is('group_id', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('forum_threads')
      .select('*, profiles(full_name)')
      .is('group_id', null)
      .order('updated_at', { ascending: false })
      .limit(10),
    supabase
      .from('community_groups')
      .select('id, name, description, category')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-gradient-to-r from-violet-700 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-3xl font-bold">Community</h1>
          <p className="mt-2 text-violet-200">Share impact, discuss ideas, and connect with fellow volunteers.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/groups" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">
              Browse groups →
            </Link>
            <Link href="/messages" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">
              Messages →
            </Link>
            <Link href="/transfers" className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-semibold">
              Transfers →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-4">Share an update</h2>
            <SharePostForm />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Community feed</h2>
            <div className="space-y-4">
              {(posts ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">No posts yet. Be the first to share!</p>
              ) : (
                (posts ?? []).map((post) => (
                  <article key={post.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium">{post.profiles?.full_name ?? 'Volunteer'}</p>
                      <span className="text-xs text-gray-400">{post.created_at ? formatDate(post.created_at) : ''}</span>
                    </div>
                    <p className="mt-2 text-sm whitespace-pre-wrap">{post.body}</p>
                    {post.share_url && (
                      <a href={post.share_url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:underline mt-2 inline-block">
                        {post.share_url}
                      </a>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800">{post.post_type}</span>
                      <ShareLinkButton url={`/community#post-${post.id}`} label="Share" variant="light" />
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <h2 className="text-lg font-semibold mb-4">Platform forum</h2>
            <NewThreadForm />
            <ul className="mt-4 space-y-2">
              {(threads ?? []).map((thread) => (
                <li key={thread.id}>
                  <Link href={`/community/forum/${thread.id}`} className="text-sm font-medium text-emerald-600 hover:underline">
                    {thread.title}
                  </Link>
                  <p className="text-xs text-gray-500">by {thread.profiles?.full_name ?? 'Volunteer'}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white dark:bg-gray-900 rounded-xl border p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Groups</h2>
              <Link href="/groups" className="text-sm text-emerald-600 hover:underline">View all</Link>
            </div>
            <ul className="space-y-3">
              {(groups ?? []).map((g) => (
                <li key={g.id}>
                  <Link href={`/groups/${g.id}`} className="font-medium text-sm hover:text-emerald-600">
                    {g.name}
                  </Link>
                  {g.category && <p className="text-xs text-gray-500">{g.category}</p>}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
