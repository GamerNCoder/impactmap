import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDate } from '@/lib/constants'

export const metadata = {
  title: 'Messages | ImpactMap',
  description: 'Private conversations with other volunteers.',
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/messages')

  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at')
    .eq('user_id', user.id)

  const convIds = (memberships ?? []).map((m) => m.conversation_id)

  if (convIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-gray-600 mt-2">No conversations yet. Visit a volunteer profile to start a chat.</p>
        <Link href="/community" className="text-emerald-600 hover:underline text-sm mt-4 inline-block">Go to Community →</Link>
      </div>
    )
  }

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .in('id', convIds)
    .order('updated_at', { ascending: false })

  const { data: allMembers } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, profiles(full_name)')
    .in('conversation_id', convIds)

  const { data: lastMessages } = await supabase
    .from('messages')
    .select('conversation_id, body, created_at, sender_id')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  const lastByConv = new Map<string, { body: string; created_at: string | null }>()
  for (const msg of lastMessages ?? []) {
    if (!lastByConv.has(msg.conversation_id)) {
      lastByConv.set(msg.conversation_id, { body: msg.body, created_at: msg.created_at })
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/community" className="text-sm text-emerald-600 hover:underline">← Community</Link>
        <h1 className="text-2xl font-bold mt-2">Messages</h1>

        <ul className="mt-8 space-y-2">
          {(conversations ?? []).map((conv) => {
            const others = (allMembers ?? [])
              .filter((m) => m.conversation_id === conv.id && m.user_id !== user.id)
            const label = conv.is_group
              ? conv.title ?? 'Group chat'
              : others.map((o) => (o.profiles as { full_name?: string } | null)?.full_name ?? 'Volunteer').join(', ') || 'Conversation'
            const last = lastByConv.get(conv.id)

            return (
              <li key={conv.id}>
                <Link
                  href={`/messages/${conv.id}`}
                  className="block bg-white dark:bg-gray-900 rounded-xl border p-4 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{label}</span>
                    {last?.created_at && (
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(last.created_at)}</span>
                    )}
                  </div>
                  {last && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{last.body}</p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
