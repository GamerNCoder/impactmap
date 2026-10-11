'use client'

import { useState } from 'react'
import LocationField from '@/components/LocationField'
import SkillPicker from '@/components/SkillPicker'
import { createClient } from '@/lib/supabase/client'
import { MIN_SKILLS_REQUIRED } from '@/lib/skills'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import { StepEnter } from '@/components/motion'
import { looksLikeCoordinates } from '@/lib/geocode'

type OnboardingWizardProps = {
  initialName: string
  initialLocation: string
}

export default function OnboardingWizard({
  initialName,
  initialLocation,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [fullName, setFullName] = useState(initialName)
  const [location, setLocation] = useState(initialLocation)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Please enter your name.'
    if (!location.trim()) errors.location = 'Please enter your area or use Locate.'
    else if (looksLikeCoordinates(location)) {
      errors.location = 'Enter a city and state (e.g. Austin, Texas), not GPS coordinates.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateStep2 = (): boolean => {
    if (selectedSkills.length < MIN_SKILLS_REQUIRED) {
      setFieldErrors({
        skills: `Please select at least ${MIN_SKILLS_REQUIRED} skill.`,
      })
      return false
    }
    setFieldErrors({})
    return true
  }

  const goToStep2 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (validateStep1()) setStep(2)
  }

  const goToStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (validateStep2()) setStep(3)
  }

  const finish = async () => {
    if (!validateStep1() || !validateStep2()) {
      if (!fullName.trim() || !location.trim()) setStep(1)
      else setStep(2)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error: updateError } = await supabase.from('profiles').update({
        full_name: fullName.trim(),
        location: location.trim(),
        skills: selectedSkills,
      }).eq('id', user.id)

      if (updateError) throw updateError

      trackClientEvent(APP_EVENTS.ONBOARDING_COMPLETE)
      router.push('/matches')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex-1">
            <div
              className={`h-2 rounded-full transition-all duration-500 ease-out ${
                n <= step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {step === 1 && (
        <StepEnter step={1}>
        <form onSubmit={goToStep2} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to ImpactMap</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Let&apos;s set up your volunteer profile so SkillMatch can find roles where you&apos;ll thrive.
            </p>
          </div>
          <div>
            <label htmlFor="onboarding-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your name <span className="text-red-500">*</span>
            </label>
            <input
              id="onboarding-name"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }))
              }}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3"
              placeholder="Alex Johnson"
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.fullName}</p>
            )}
          </div>
          <LocationField
            value={location}
            onChange={(value) => {
              setLocation(value)
              if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: '' }))
            }}
            autoRequest
            required
            label="Your area"
            placeholder="City, neighborhood"
          />
          {fieldErrors.location && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.location}</p>
          )}
          <button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 motion-pressable">
            Continue
          </button>
        </form>
        </StepEnter>
      )}

      {step === 2 && (
        <StepEnter step={2}>
        <form onSubmit={goToStep3} className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">What are you good at?</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Choose every skill that applies — SkillMatch uses these to rank events for you.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your skills <span className="text-red-500">*</span>
            </p>
            <SkillPicker
              selected={selectedSkills}
              onChange={(skills) => {
                setSelectedSkills(skills)
                if (fieldErrors.skills) setFieldErrors((prev) => ({ ...prev, skills: '' }))
              }}
              error={fieldErrors.skills}
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-medium motion-pressable">
              Back
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 motion-pressable">
              Continue
            </button>
          </div>
        </form>
        </StepEnter>
      )}

      {step === 3 && (
        <StepEnter step={3}>
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">You&apos;re ready</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              SkillMatch will rank events by fit. Join one, log hours, and build your Impact Passport.
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 text-left text-sm space-y-2">
            <p><strong className="text-gray-900 dark:text-white">{fullName}</strong> · {location}</p>
            <p className="text-gray-500">{selectedSkills.join(' · ')}</p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-medium motion-pressable">
              Back
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 motion-pressable"
            >
              {loading ? 'Saving…' : 'See my matches'}
            </button>
          </div>
        </div>
        </StepEnter>
      )}
    </div>
  )
}
