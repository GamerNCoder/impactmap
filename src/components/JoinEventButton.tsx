'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import type { Dictionary } from '@/lib/i18n'

type JoinEventButtonProps = {
  opportunityId: string
  opportunityTitle: string
  organizationId: string | null
  isJoined: boolean
  isFull: boolean
  isOpen: boolean
  isHost: boolean
  dict: Dictionary
}

export default function JoinEventButton({
  opportunityId,
  opportunityTitle,
  organizationId,
  isJoined,
  isFull,
  isOpen,
  isHost,
  dict,
}: JoinEventButtonProps) {
  const [joined, setJoined] = useState(isJoined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleJoin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?next=/opportunities/${opportunityId}`)
        return
      }

      const { data, error: rpcError } = await supabase.rpc('join_opportunity', {
        p_opportunity_id: opportunityId,
      })

      if (rpcError) throw rpcError

      const result = data as { ok: boolean; error?: string }
      if (!result.ok) {
        switch (result.error) {
          case 'full':
            throw new Error('This event is full.')
          case 'already_joined':
            setJoined(true)
            break
          case 'closed':
            throw new Error('This event is no longer open.')
          default:
            throw new Error('Could not join event.')
        }
      } else {
        setJoined(true)
        trackClientEvent(APP_EVENTS.OPPORTUNITY_JOIN, {
          organizationId: organizationId ?? undefined,
          resourceType: 'opportunity',
          resourceId: opportunityId,
        })
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('leave_opportunity', {
        p_opportunity_id: opportunityId,
      })

      if (rpcError) throw rpcError

      const result = data as { ok: boolean; error?: string }
      if (!result.ok && result.error !== 'not_joined') {
        throw new Error('Could not leave event.')
      }

      setJoined(false)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to leave')
    } finally {
      setLoading(false)
    }
  }

  if (isHost) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">{dict.common.hostPosted}</p>
        {organizationId && (
          <Link
            href={`/organizations/${organizationId}/manage`}
            className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-800"
          >
            {dict.common.signups}
          </Link>
        )}
      </div>
    )
  }

  if (!isOpen) {
    return <p className="text-gray-600">{dict.common.eventClosed}</p>
  }

  if (joined) {
    return (
      <div className="space-y-3">
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 px-4 py-3 rounded-lg text-sm">
          {dict.common.signedUp} <strong>{opportunityTitle}</strong>.
        </div>
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleLeave}
          disabled={loading}
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? dict.common.updating : dict.common.cancel}
        </button>
        <p className="text-xs text-gray-500">
          {dict.event.joinedHint}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {isFull ? (
        <p className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 px-4 py-3 rounded-lg text-sm">
          {dict.common.eventFull}
        </p>
      ) : (
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading}
          className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
        >
          {loading ? dict.common.joining : dict.common.join}
        </button>
      )}
      <p className="text-xs text-gray-500 text-center">
        {dict.common.oneClick}
      </p>
    </div>
  )
}
