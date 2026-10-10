import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ForumReplyForm } from '@/components/ForumForms'
import { formatDate } from '@/lib/constants'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: thread } = await supabase.from('forum_threads').select('title').eq('id', id).maybeSingle()
  return { title: thread?.title ? `${thread.title} | Forum` : 'Forum thread' }
}

export default async function ForumThreadPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/community/forum/${id}`)

  const { data: thread } = await supabase
    .from('forum_threads')
    .select('*, profiles(full_name), community_groups(name, id)')
    .eq('id', id)
    .maybeSingle()

  if (!thread) notFound()

  const { data: posts } = await supabase
    .from('forum_posts')
    .select('*, profiles(full_name)')
    .eq('thread_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href={thread.group_id ? `/groups/${thread.group_id}` : '/community'} className="text-sm text-emerald-600 hover:underline">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold mt-4">{thread.title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Started by {thread.profiles?.full_name ?? 'Volunteer'}
          {thread.community_groups && ` in ${thread.community_groups.name}`}
        </p>

        <div className="mt-8 space-y-4">
          {(posts ?? []).map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{post.profiles?.full_name ?? 'Volunteer'}</span>
                <span className="text-gray-400">{post.created_at ? formatDate(post.created_at) : ''}</span>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{post.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Reply</h2>
          <ForumReplyForm threadId={id} />
        </div>
      </div>
    </div>
  )
}
