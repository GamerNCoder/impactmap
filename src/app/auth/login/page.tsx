'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthDivider, AuthOAuthSection } from '@/components/AuthOAuthSection'
import TermsCheckbox, { setTermsPendingCookie } from '@/components/TermsCheckbox'
import { getOAuthErrorMessage, hasEnabledOAuthProviders } from '@/lib/auth'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import { FadeIn } from '@/components/motion'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsError, setTermsError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const oauthError = getOAuthErrorMessage(searchParams.get('error'))
  const displayError = error || oauthError
  const nextPath = searchParams.get('next') || '/dashboard'

  const guardTerms = () => {
    if (!termsAccepted) {
      setTermsError('You must agree to the Terms & Conditions to continue.')
      return false
    }
    setTermsPendingCookie(CURRENT_TERMS_VERSION)
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guardTerms()) return
    setTermsError(null)
    setLoading(true)
    setError(null)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const now = new Date().toISOString()
        await supabase
          .from('profiles')
          .update({
            terms_accepted_at: now,
            terms_version: CURRENT_TERMS_VERSION,
          })
          .eq('id', data.user.id)
      }

      const destination = nextPath.startsWith('/') ? nextPath : '/dashboard'
      trackClientEvent(APP_EVENTS.AUTH_LOGIN)
      router.push(destination)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow duration-200'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 motion-fade-in-up">
        <FadeIn className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Sign in to ImpactMap</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Connect with volunteering opportunities in your community
          </p>
        </FadeIn>

        {displayError && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm motion-shake">
            {displayError}
          </div>
        )}

        <FadeIn delay={1} className="space-y-4">
        <TermsCheckbox
          checked={termsAccepted}
          onChange={(value) => {
            setTermsAccepted(value)
            if (termsError) setTermsError(null)
            if (value) setTermsPendingCookie(CURRENT_TERMS_VERSION)
          }}
          error={termsError}
          id="login-terms"
        />

        {hasEnabledOAuthProviders() && !termsAccepted && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accept the terms above before using a social sign-in provider.
          </p>
        )}

        <AuthOAuthSection
          mode="signin"
          next={nextPath}
          onBeforeOAuth={guardTerms}
        />
        </FadeIn>

        <FadeIn delay={2}>
        <AuthDivider label="Or continue with email" />
        </FadeIn>

        <FadeIn delay={3}>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        </FadeIn>

        <FadeIn delay={4}>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium text-emerald-700 hover:underline">
            Sign up
          </Link>
        </p>
        </FadeIn>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-950" />}>
      <LoginForm />
    </Suspense>
  )
}
