'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'
import { sanitizeText } from '@/lib/security'

export default function CreateGroupForm() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in required')

      const { data: group, error: insertError } = await supabase
        .from('community_groups')
        .insert({
          name: sanitizeText(name, 120),
          description: sanitizeText(description, 500) || null,
          category: category || null,
          created_by: user.id,
          is_public: isPublic,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      await supabase.from('group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'owner',
      })

      router.push(`/groups/${group.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">Group name *</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border px-4 py-3 text-sm dark:bg-gray-900">
          <option value="">General</option>
          {OPPORTUNITY_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
        Public group (anyone can discover and join)
      </label>
      <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50">
        {loading ? 'Creating…' : 'Create group'}
      </button>
    </form>
  )
}
