'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TermsCheckbox, { clearTermsPendingCookie } from '@/components/TermsCheckbox'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

export default function AcceptTermsForm() {
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accepted) {
      setFieldError('You must agree to the Terms & Conditions to continue.')
      return
    }
    setFieldError(null)
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push(`/auth/login?next=${encodeURIComponent('/auth/accept-terms')}`)
        return
      }

      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: now,
          terms_version: CURRENT_TERMS_VERSION,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      clearTermsPendingCookie()
      router.push(nextPath.startsWith('/') ? nextPath : '/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save acceptance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Terms &amp; Conditions</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please review and accept our terms before continuing to use ImpactMap.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <TermsCheckbox
            checked={accepted}
            onChange={(value) => {
              setAccepted(value)
              if (fieldError) setFieldError(null)
            }}
            error={fieldError}
          />

          <p className="text-xs text-gray-500">
            Read the full{' '}
            <Link href="/terms" target="_blank" className="text-emerald-700 hover:underline">
              Terms &amp; Conditions
            </Link>
            .
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Continue to ImpactMap'}
          </button>
        </form>
      </div>
    </div>
  )
}
