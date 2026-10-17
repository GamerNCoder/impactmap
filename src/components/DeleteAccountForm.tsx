'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/** The user has to type this exactly; it is the last thing standing between a click and a deleted account. */
const CONFIRM_PHRASE = 'DELETE'

export default function DeleteAccountForm() {
  const [confirmText, setConfirmText] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const confirmed = acknowledged && confirmText.trim() === CONFIRM_PHRASE
  const canDelete = confirmed && !loading

  // Give the confirmation message a moment to be read, then send them home signed out.
  useEffect(() => {
    if (!deleted) return
    const timer = setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 3000)
    return () => clearTimeout(timer)
  }, [deleted, router])

  const handleDelete = async () => {
    // The button is already disabled until both conditions hold, but nothing should be able
    // to destroy an account by accident.
    if (!confirmed) {
      setError(`Tick the box and type ${CONFIRM_PHRASE} to confirm.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('delete_my_account')
      if (rpcError) throw rpcError

      const result = data as { ok: boolean; error?: string } | null
      if (!result?.ok) {
        if (result?.error === 'auth') {
          throw new Error('Your session expired. Sign in again and retry.')
        }
        if (result?.error === 'not_found') {
          throw new Error('We could not find this account — it may already have been deleted.')
        }
        throw new Error(
          'We could not delete your account just now. Nothing was removed — please try again, or email us and we will do it for you.'
        )
      }

      // The auth row is gone, so drop the now-useless session before showing the confirmation.
      await supabase.auth.signOut()
      setDeleted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Nothing was deleted.')
    } finally {
      setLoading(false)
    }
  }

  if (deleted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 px-4 py-4 text-sm text-emerald-900 dark:text-emerald-100"
      >
        <p className="font-semibold">Your account has been deleted.</p>
        <p className="mt-1">
          Your profile, applications, logged hours and event check-ins are gone, and you are signed out. A copy may
          remain in routine backups until they rotate, and we keep one anonymous note that a deletion happened, with
          nothing that identifies you.
        </p>
        <p className="mt-1">Taking you back to the home page&hellip;</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        This deletes your account and everything attached to it: your profile and private details, your event
        applications, the hours you logged, your QR check-ins and your badges. Verification codes for your hours stop
        working, so a school or counselor will no longer be able to check them. It cannot be undone, and you would have
        to sign up again from scratch.
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          {error}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-red-100 dark:border-red-950 bg-red-50/50 dark:bg-red-950/30 p-4">
        <div className="flex items-start gap-3">
          <input
            id="delete-acknowledge"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-red-600 focus:ring-red-500"
          />
          <label htmlFor="delete-acknowledge" className="text-sm text-gray-700 dark:text-gray-300">
            I understand this permanently deletes my account and my data, and that it cannot be undone.
          </label>
        </div>

        <div>
          <label
            htmlFor="delete-confirm"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Type {CONFIRM_PHRASE} to confirm
          </label>
          <input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-describedby="delete-confirm-hint"
            placeholder={CONFIRM_PHRASE}
            className="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
          />
          <p id="delete-confirm-hint" className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Capital letters, exactly as shown.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-600 dark:focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Deleting your account\u2026' : 'Permanently delete my account'}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          The button stays disabled until the box is ticked and {CONFIRM_PHRASE} is typed.
        </p>
      </div>
    </div>
  )
}
