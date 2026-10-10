'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import type { Database } from '@/types/database'
import LocationField from '@/components/LocationField'
import SkillPicker from '@/components/SkillPicker'
import { filterValidSkills, MIN_SKILLS_REQUIRED } from '@/lib/skills'
import { looksLikeCoordinates } from '@/lib/geocode'

type Profile = Database['public']['Tables']['profiles']['Row']

type ProfileFormProps = {
  profile: Profile | null
  userEmail: string
}

export default function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [location, setLocation] = useState(profile?.location || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    filterValidSkills(profile?.skills)
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Please enter your name.'
    if (!location.trim()) errors.location = 'Please enter your location or use Locate.'
    else if (looksLikeCoordinates(location)) {
      errors.location = 'Enter a city and state (e.g. Austin, Texas), not GPS coordinates.'
    }
    if (selectedSkills.length < MIN_SKILLS_REQUIRED) {
      errors.skills = `Please select at least ${MIN_SKILLS_REQUIRED} skill.`
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setLoading(false)
      return
    }
    setFieldErrors({})

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { error: updateError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: userEmail,
        full_name: fullName.trim(),
        bio: bio.trim() || null,
        location: location.trim(),
        phone: phone.trim() || null,
        skills: selectedSkills,
      })

      if (updateError) throw updateError

      trackClientEvent(APP_EVENTS.PROFILE_UPDATE)
      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Profile updated successfully.
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          id="email"
          type="email"
          disabled
          value={userEmail}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value)
            if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }))
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {fieldErrors.fullName && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <textarea
          id="bio"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Tell organizations about yourself..."
        />
      </div>

      <div>
        <LocationField
          value={location}
          onChange={(value) => {
            setLocation(value)
            if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: '' }))
          }}
          required
          label="Location"
          placeholder="City, State"
        />
        {fieldErrors.location && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Skills <span className="text-red-500">*</span>
        </p>
        <SkillPicker
          selected={selectedSkills}
          onChange={(skills) => {
            setSelectedSkills(skills)
            if (fieldErrors.skills) setFieldErrors((prev) => ({ ...prev, skills: '' }))
          }}
          error={fieldErrors.skills}
          hint="Tap every skill that applies to you."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  )
}
