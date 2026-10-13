'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

type ProfileFormProps = {
  profile: Profile | null
  userEmail: string
}

export default function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    if (!fullName.trim()) {
      setError('Please enter your name.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be signed in')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
      if (updateError) throw updateError
      trackClientEvent(APP_EVENTS.PROFILE_UPDATE)
      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">Saved.</div>}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name (shown on your verified hours)
        </label>
        <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (private)</label>
        <input id="email" value={userEmail} disabled className={`${inputClass} bg-gray-50 dark:bg-gray-800 text-gray-500`} />
      </div>

      {profile?.guardian_name && (
        <div className="text-sm text-gray-600 dark:text-gray-400 rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3">
          Parent or guardian on file (private): {profile.guardian_name}
          {profile.guardian_email && ` · ${profile.guardian_email}`}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-800 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
