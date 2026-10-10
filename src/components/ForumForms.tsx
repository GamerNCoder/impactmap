'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { sanitizeText, POST_MAX_LENGTH } from '@/lib/security'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type ForumReplyFormProps = {
  threadId: string
}

export function ForumReplyForm({ threadId }: ForumReplyFormProps) {
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
      await supabase.from('forum_posts').insert({
        thread_id: threadId,
        author_id: user.id,
        body: sanitizeText(body, POST_MAX_LENGTH),
      })
      trackClientEvent(APP_EVENTS.FORUM_POST, { resourceType: 'forum_thread', resourceId: threadId })
      setBody('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a reply…"
        className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900"
      />
      <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
        {loading ? 'Posting…' : 'Reply'}
      </button>
    </form>
  )
}

type NewThreadFormProps = {
  groupId?: string
}

export function NewThreadForm({ groupId }: NewThreadFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: thread, error } = await supabase
        .from('forum_threads')
        .insert({
          group_id: groupId ?? null,
          author_id: user.id,
          title: sanitizeText(title, 200),
        })
        .select('id')
        .single()

      if (error) throw error

      await supabase.from('forum_posts').insert({
        thread_id: thread.id,
        author_id: user.id,
        body: sanitizeText(body, POST_MAX_LENGTH),
      })

      trackClientEvent(APP_EVENTS.FORUM_POST, { resourceType: 'forum_thread', resourceId: thread.id })

      setTitle('')
      setBody('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Thread title"
        required
        className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Start the discussion…"
        required
        rows={4}
        className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900"
      />
      <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
        {loading ? 'Creating…' : 'Start thread'}
      </button>
    </form>
  )
}
