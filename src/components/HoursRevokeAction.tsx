'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  hourId: string
  volunteerName: string
  hours: number
  revoked: boolean
}

type Toast = { kind: 'revoked' | 'restored'; text: string }

function errorMessage(code: string | undefined): string {
  if (code === 'not_manager') return 'Only this event\u2019s organizer can change an approval.'
  if (code === 'not_approved') return 'Only an approved record with a code can be revoked.'
  if (code === 'not_found') return 'That record no longer exists.'
  if (code === 'not_authenticated') return 'Sign in again to change this approval.'
  return 'Could not update the approval. Try again.'
}

export default function HoursRevokeAction({ hourId, volunteerName, hours, revoked }: Props) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), toast.kind === 'revoked' ? 15000 : 8000)
    return () => clearTimeout(timer)
  }, [toast])

  const call = async (fn: 'revoke_hours' | 'restore_hours') => {
    setPending(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc(fn, { p_hours_id: hourId })
    setPending(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }
    const result = data as { ok?: boolean; error?: string } | null
    if (result?.ok === false) {
      setError(errorMessage(result.error))
      return
    }

    setToast(
      fn === 'revoke_hours'
        ? { kind: 'revoked', text: `Revoked ${hours}h for ${volunteerName}.` }
        : { kind: 'restored', text: `Restored ${hours}h for ${volunteerName}.` }
    )
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {revoked ? (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Revoked
          </span>
          <button
            type="button"
            onClick={() => call('restore_hours')}
            disabled={pending}
            className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-50"
          >
            {pending ? 'Restoring…' : 'Restore'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => call('revoke_hours')}
          disabled={pending}
          aria-label={`Revoke ${hours}h for ${volunteerName}`}
          className="text-sm font-semibold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-1.5 hover:bg-red-100 dark:hover:bg-red-950 disabled:opacity-50"
        >
          {pending ? 'Revoking…' : 'Revoke'}
        </button>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300 max-w-[18rem] text-right">
          {error}
        </p>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-wrap items-center justify-center gap-4 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-3 text-sm shadow-lg"
        >
          <span>{toast.text}</span>
          {toast.kind === 'revoked' && (
            <button
              type="button"
              onClick={() => call('restore_hours')}
              disabled={pending}
              className="font-semibold underline underline-offset-4 disabled:opacity-50"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/80 dark:text-gray-700 underline underline-offset-4"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
