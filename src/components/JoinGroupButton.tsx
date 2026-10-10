'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type JoinGroupButtonProps = {
  groupId: string
  isMember: boolean
}

export default function JoinGroupButton({ groupId, isMember }: JoinGroupButtonProps) {
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState(isMember)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('group_members').insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
      })
      trackClientEvent(APP_EVENTS.GROUP_JOIN, { resourceType: 'group', resourceId: groupId })
      setMember(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (member) {
    return <span className="text-sm text-emerald-600 font-medium">Member</span>
  }

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={loading}
      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
    >
      {loading ? 'Joining…' : 'Join group'}
    </button>
  )
}
