'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const GUARDIAN_AGE = 16

function ageOn(dateOfBirth: string): number {
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

/**
 * Ages 13-15 need a guardian's name, email and consent, and under-13s are not allowed.
 * Email/password sign-up collects this in the sign-up form; any account created another
 * way (social sign-in) lands here so the rule cannot be skipped.
 */
export default function CompleteProfileForm() {
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [guardianConsent, setGuardianConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [blocked, setBlocked] = useState(false)
  const [studentEmail, setStudentEmail] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/dashboard'
  const supabase = createClient()

  const age = dateOfBirth ? ageOn(dateOfBirth) : null
  const needsGuardian = age !== null && age >= 13 && age < GUARDIAN_AGE

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login?next=/auth/complete-profile')
        return
      }
      setStudentEmail(user.email ?? '')
    })
  }, [router, supabase])

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!dateOfBirth) errors.dateOfBirth = 'Please enter your birthday.'
    else if (age !== null && age < 13) errors.dateOfBirth = 'You must be at least 13 to use ImpactMap.'
    if (needsGuardian) {
      if (!guardianName.trim()) errors.guardianName = 'Please enter your parent or guardian’s name.'
      if (!guardianEmail.trim()) errors.guardianEmail = 'Please enter their email.'
      else if (studentEmail && guardianEmail.trim().toLowerCase() === studentEmail.toLowerCase()) {
        errors.guardianEmail = 'Use your parent or guardian’s own email.'
      }
      if (!guardianConsent) errors.guardianConsent = 'Your parent or guardian must agree.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // Under 13: no account. Releasing the session keeps the rule honest.
    if (age !== null && age < 13) {
      await supabase.auth.signOut()
      setBlocked(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?next=/auth/complete-profile')
        return
      }

      const now = new Date().toISOString()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          date_of_birth: dateOfBirth,
          ...(needsGuardian && {
            guardian_name: guardianName.trim(),
            guardian_email: guardianEmail.trim(),
            guardian_consent_at: now,
          }),
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push(nextPath.startsWith('/') ? nextPath : '/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save your details')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'appearance-none rounded-lg block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'
  const errorText = (key: string) =>
    fieldErrors[key] ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors[key]}</p> : null

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
        <div className="max-w-md w-full space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sorry, you can’t use ImpactMap yet</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You must be at least 13 years old. You have been signed out and no account was kept.
          </p>
          <Link href="/safety" className="inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
            Why we have this rule →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">One more step</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We need your birthday to apply our age rules. It stays private — organizers never see it.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6" noValidate>
          <div>
            <label htmlFor="dob" className={labelClass}>Birthday</label>
            <input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputClass}
            />
            {errorText('dateOfBirth')}
          </div>

          {needsGuardian && (
            <fieldset className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-3">
              <legend className="px-1 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Parent or guardian (under {GUARDIAN_AGE})
              </legend>
              <div>
                <label htmlFor="guardianName" className={labelClass}>Their name</label>
                <input
                  id="guardianName"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className={inputClass}
                />
                {errorText('guardianName')}
              </div>
              <div>
                <label htmlFor="guardianEmail" className={labelClass}>Their email</label>
                <input
                  id="guardianEmail"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className={inputClass}
                />
                {errorText('guardianEmail')}
              </div>
              <label htmlFor="guardianConsent" className="flex items-start gap-3 cursor-pointer">
                <input
                  id="guardianConsent"
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  My parent or guardian knows I&apos;m joining ImpactMap and agrees.
                </span>
              </label>
              {errorText('guardianConsent')}
            </fieldset>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
          <p className="text-xs text-center text-gray-500">
            <Link href="/safety" className="underline">How we keep students safe</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
