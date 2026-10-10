'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { sanitizeText, MESSAGE_MAX_LENGTH } from '@/lib/security'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type MessageComposerProps = {
  conversationId: string
}

export default function MessageComposer({ conversationId }: MessageComposerProps) {
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body: sanitizeText(body, MESSAGE_MAX_LENGTH),
      })

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      trackClientEvent(APP_EVENTS.MESSAGE_SEND, {
        resourceType: 'conversation',
        resourceId: conversationId,
      })

      setBody('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
      <input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Type a message…"
        className="flex-1 rounded-xl border px-4 py-2 text-sm dark:bg-gray-900"
      />
      <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
        Send
      </button>
    </form>
  )
}

type StartConversationButtonProps = {
  recipientId: string
  recipientName: string
}

export function StartConversationButton({ recipientId, recipientName }: StartConversationButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const startChat = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id === recipientId) return

      const { data: myConvs } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id)

      const myIds = (myConvs ?? []).map((c) => c.conversation_id)

      if (myIds.length > 0) {
        const { data: shared } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', recipientId)
          .in('conversation_id', myIds)

        for (const row of shared ?? []) {
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id')
            .eq('conversation_id', row.conversation_id)
          if (members?.length === 2) {
            router.push(`/messages/${row.conversation_id}`)
            return
          }
        }
      }

      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ is_group: false, created_by: user.id })
        .select('id')
        .single()

      if (error) throw error

      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: recipientId },
      ])

      router.push(`/messages/${conv.id}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={startChat}
      disabled={loading}
      className="text-sm font-semibold text-emerald-600 hover:underline disabled:opacity-50"
    >
      {loading ? 'Opening…' : `Message ${recipientName}`}
    </button>
  )
}
