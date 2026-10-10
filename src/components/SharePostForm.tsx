'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { sanitizeText, sanitizeUrl, POST_MAX_LENGTH } from '@/lib/security'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type SharePostFormProps = {
  groupId?: string
}

export default function SharePostForm({ groupId }: SharePostFormProps) {
  const [body, setBody] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [postType, setPostType] = useState('update')
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

      await supabase.from('shared_posts').insert({
        group_id: groupId ?? null,
        author_id: user.id,
        body: sanitizeText(body, POST_MAX_LENGTH),
        share_url: sanitizeUrl(shareUrl),
        post_type: postType,
      })
      trackClientEvent(APP_EVENTS.SHARE_POST, {
        resourceType: groupId ? 'group' : 'community',
        resourceId: groupId,
      })
      setBody('')
      setShareUrl('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-xl p-4 bg-white dark:bg-gray-900">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share an update, resource, or story…"
        required
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900"
      />
      <input
        value={shareUrl}
        onChange={(e) => setShareUrl(e.target.value)}
        placeholder="Optional link (https://…)"
        className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-900"
      />
      <select value={postType} onChange={(e) => setPostType(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-900">
        <option value="update">Update</option>
        <option value="event">Event</option>
        <option value="credential">Credential</option>
        <option value="resource">Resource</option>
      </select>
      <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50">
        {loading ? 'Sharing…' : 'Share'}
      </button>
    </form>
  )
}
