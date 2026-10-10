import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import MessageComposer from '@/components/MessageComposer'
import TransferRequestForm from '@/components/TransferRequestForm'
import { formatDate } from '@/lib/constants'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/messages/${id}`)

  const { data: membership } = await supabase
    .from('conversation_members')
    .select('id')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) notFound()

  const [{ data: conversation }, { data: members }, { data: messages }, { data: profile }] = await Promise.all([
    supabase.from('conversations').select('*').eq('id', id).single(),
    supabase.from('conversation_members').select('user_id, profiles(full_name, id_verification_status)').eq('conversation_id', id),
    supabase.from('messages').select('*, profiles(full_name)').eq('conversation_id', id).order('created_at', { ascending: true }),
    supabase.from('profiles').select('id_verification_status').eq('id', user.id).single(),
  ])

  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', id)
    .eq('user_id', user.id)

  const others = (members ?? []).filter((m) => m.user_id !== user.id)
  const other = others[0]
  const otherProfile = other?.profiles as { full_name?: string; id_verification_status?: string } | null | undefined
  const title = conversation?.is_group
    ? conversation.title ?? 'Group chat'
    : otherProfile?.full_name ?? 'Conversation'

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full flex flex-col">
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/messages" className="text-sm text-emerald-600 hover:underline">← Messages</Link>
          <h1 className="text-lg font-semibold mt-1">{title}</h1>
          {!conversation?.is_group && other && (
            <Link href={`/volunteers/${other.user_id}`} className="text-xs text-gray-500 hover:underline">
              View profile
            </Link>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto mb-4">
          {(messages ?? []).map((msg) => {
            const mine = msg.sender_id === user.id
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-900 border'}`}>
                  {!mine && <p className="text-xs font-medium mb-1 opacity-70">{(msg.profiles as { full_name?: string } | null)?.full_name}</p>}
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className={`text-xs mt-1 ${mine ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {msg.created_at ? formatDate(msg.created_at) : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <MessageComposer conversationId={id} />

        {!conversation?.is_group && other && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold mb-3">P2P transfer request</h2>
            <TransferRequestForm
              recipientId={other.user_id}
              recipientName={otherProfile?.full_name ?? 'Volunteer'}
              senderIdVerified={profile?.id_verification_status === 'verified'}
            />
          </div>
        )}
      </div>
    </div>
  )
}
