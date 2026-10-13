'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TermsCheckbox, { setTermsPendingCookie } from '@/components/TermsCheckbox'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

const GUARDIAN_AGE = 16

function ageOn(dateOfBirth: string): number {
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianConsent, setGuardianConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const supabase = createClient()
  const age = dateOfBirth ? ageOn(dateOfBirth) : null
  const needsGuardian = age !== null && age >= 13 && age < GUARDIAN_AGE

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Please enter your name.'
    if (!email.trim()) errors.email = 'Please enter your email.'
    if (!password || password.length < 6) errors.password = 'Use at least 6 characters.'
    if (!dateOfBirth) errors.dateOfBirth = 'Please enter your birthday.'
    else if (age !== null && age < 13) errors.dateOfBirth = 'You must be at least 13 to use ImpactMap.'
    if (needsGuardian) {
      if (!guardianName.trim()) errors.guardianName = 'Please enter your parent or guardian’s name.'
      if (!guardianEmail.trim()) errors.guardianEmail = 'Please enter their email.'
      else if (guardianEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
        errors.guardianEmail = 'Use your parent or guardian’s own email.'
      }
      if (!guardianConsent) errors.guardianConsent = 'Your parent or guardian must agree.'
    }
    if (!termsAccepted) errors.terms = 'You must agree to the Terms.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim(), terms_version: CURRENT_TERMS_VERSION } },
      })
      if (signUpError) throw signUpError

      if (data?.session && data.user) {
        const now = new Date().toISOString()
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName.trim(),
            date_of_birth: dateOfBirth,
            terms_accepted_at: now,
            terms_version: CURRENT_TERMS_VERSION,
            ...(needsGuardian && {
              guardian_name: guardianName.trim(),
              guardian_email: guardianEmail.trim(),
              guardian_consent_at: now,
            }),
          })
          .eq('id', data.user.id)
        if (profileError) throw profileError

        trackClientEvent(APP_EVENTS.AUTH_SIGNUP)
        router.push('/opportunities')
        router.refresh()
        return
      }

      setError('Account created. Check your email to confirm, then sign in.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const errorText = (key: string) =>
    fieldErrors[key] ? <p className="mt-1 text-sm text-red-600">{fieldErrors[key]}</p> : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6 motion-fade-in-up">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Find events, log hours, and get them verified.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6" onSubmit={handleSignup} noValidate>
          <div>
            <label htmlFor="fullName" className={labelClass}>Full name</label>
            <input id="fullName" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Alex Johnson" />
            {errorText('fullName')}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
            {errorText('email')}
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="At least 6 characters" />
            {errorText('password')}
          </div>
          <div>
            <label htmlFor="dob" className={labelClass}>Birthday</label>
            <input id="dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-gray-500">Kept private. Organizers never see it.</p>
            {errorText('dateOfBirth')}
          </div>

          {needsGuardian && (
            <fieldset className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-3">
              <legend className="px-1 text-sm font-semibold text-emerald-900 dark:text-emerald-200">Parent or guardian (under {GUARDIAN_AGE})</legend>
              <div>
                <label htmlFor="guardianName" className={labelClass}>Their name</label>
                <input id="guardianName" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={inputClass} />
                {errorText('guardianName')}
              </div>
              <div>
                <label htmlFor="guardianEmail" className={labelClass}>Their email</label>
                <input id="guardianEmail" type="email" value={guardianEmail} onChange={(e) => setGuardianEmail(e.target.value)} className={inputClass} />
                {errorText('guardianEmail')}
              </div>
              <label htmlFor="guardianConsent" className="flex items-start gap-3 cursor-pointer">
                <input id="guardianConsent" type="checkbox" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700" />
                <span className="text-sm text-gray-700 dark:text-gray-300">My parent or guardian knows I&apos;m joining ImpactMap and agrees.</span>
              </label>
              {errorText('guardianConsent')}
            </fieldset>
          )}

          <TermsCheckbox
            checked={termsAccepted}
            onChange={(value) => {
              setTermsAccepted(value)
              if (value) setTermsPendingCookie(CURRENT_TERMS_VERSION)
            }}
            error={fieldErrors.terms}
            id="signup-terms"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-xs text-center text-gray-500">
            <Link href="/safety" className="underline">How we keep students safe</Link>
          </p>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-emerald-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
