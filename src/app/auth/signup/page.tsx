'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TermsCheckbox, { setTermsPendingCookie } from '@/components/TermsCheckbox'
import LocationField from '@/components/LocationField'
import ChoiceChipPicker from '@/components/ChoiceChipPicker'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'
import { REFERRAL_SOURCES, VOLUNTEER_AVAILABILITY } from '@/lib/signup-options'
import { looksLikeCoordinates } from '@/lib/geocode'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [bio, setBio] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [availability, setAvailability] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const supabase = createClient()

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Please enter your full name.'
    if (!email.trim()) errors.email = 'Please enter your email.'
    if (!password || password.length < 6) errors.password = 'Password must be at least 6 characters.'
    if (!phone.trim()) errors.phone = 'Please enter your phone number.'
    if (!location.trim()) errors.location = 'Please enter your area or use Locate.'
    else if (looksLikeCoordinates(location)) {
      errors.location = 'Enter a city and state (e.g. Austin, Texas), not GPS coordinates.'
    }
    if (!dateOfBirth) errors.dateOfBirth = 'Please enter your date of birth.'
    if (!bio.trim() || bio.trim().length < 10) {
      errors.bio = 'Please write a short intro (at least 10 characters).'
    }
    if (!referralSource) errors.referralSource = 'Please tell us how you heard about ImpactMap.'
    if (availability.length === 0) errors.availability = 'Please select when you can volunteer.'
    if (categories.length === 0) errors.categories = 'Please select at least one cause you care about.'
    if (!termsAccepted) errors.terms = 'You must agree to the Terms & Conditions.'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveProfile = async (userId: string, userEmail: string) => {
    const now = new Date().toISOString()
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: userEmail,
      full_name: fullName.trim(),
      phone: phone.trim(),
      location: location.trim(),
      bio: bio.trim(),
      date_of_birth: dateOfBirth,
      volunteer_availability: availability,
      preferred_categories: categories,
      referral_source: referralSource,
      marketing_consent: marketingConsent,
      terms_accepted_at: now,
      terms_version: CURRENT_TERMS_VERSION,
    })
    if (profileError) throw profileError
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
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            location: location.trim(),
            bio: bio.trim(),
            date_of_birth: dateOfBirth,
            volunteer_availability: availability,
            preferred_categories: categories,
            referral_source: referralSource,
            marketing_consent: marketingConsent,
            terms_version: CURRENT_TERMS_VERSION,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data?.user) {
        await saveProfile(data.user.id, email)
      }

      if (data?.session) {
        trackClientEvent(APP_EVENTS.AUTH_SIGNUP)
        router.push('/onboarding')
        router.refresh()
        return
      }

      setError('Account created. Check your email to confirm, then sign in to finish setup.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow duration-200'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto space-y-8 motion-fade-in-up">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Tell us about yourself so we can match you with the right volunteer events.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="space-y-8" onSubmit={handleSignup}>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Account
            </h2>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Alex Johnson"
              />
              {fieldErrors.fullName && <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>}
            </div>
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
              {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 6 characters"
              />
              {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              About you
            </h2>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="(555) 123-4567"
              />
              {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
            </div>
            <div>
              <LocationField
                value={location}
                onChange={setLocation}
                required
                label="Your area"
                placeholder="City, neighborhood"
              />
              {fieldErrors.location && <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>}
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of birth <span className="text-red-500">*</span>
              </label>
              <input
                id="dob"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputClass}
              />
              {fieldErrors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{fieldErrors.dateOfBirth}</p>}
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Short intro <span className="text-red-500">*</span>
              </label>
              <textarea
                id="bio"
                required
                minLength={10}
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={inputClass}
                placeholder="Why do you want to volunteer? What are you hoping to contribute?"
              />
              {fieldErrors.bio && <p className="mt-1 text-sm text-red-600">{fieldErrors.bio}</p>}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
              Volunteer preferences
            </h2>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                When can you volunteer? <span className="text-red-500">*</span>
              </p>
              <ChoiceChipPicker
                options={VOLUNTEER_AVAILABILITY}
                selected={availability}
                onChange={setAvailability}
                error={fieldErrors.availability}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Causes you care about <span className="text-red-500">*</span>
              </p>
              <ChoiceChipPicker
                options={OPPORTUNITY_CATEGORIES}
                selected={categories}
                onChange={setCategories}
                error={fieldErrors.categories}
              />
            </div>
            <div>
              <label htmlFor="referral" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                How did you hear about us? <span className="text-red-500">*</span>
              </label>
              <select
                id="referral"
                required
                value={referralSource}
                onChange={(e) => setReferralSource(e.target.value)}
                className={inputClass}
              >
                <option value="">Select one</option>
                {REFERRAL_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
              {fieldErrors.referralSource && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.referralSource}</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <TermsCheckbox
              checked={termsAccepted}
              onChange={(value) => {
                setTermsAccepted(value)
                if (fieldErrors.terms) setFieldErrors((prev) => ({ ...prev, terms: '' }))
                if (value) setTermsPendingCookie(CURRENT_TERMS_VERSION)
              }}
              error={fieldErrors.terms}
              id="signup-terms"
            />
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Send me occasional emails about new events and ImpactMap updates (optional).
              </span>
            </label>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 motion-pressable"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
