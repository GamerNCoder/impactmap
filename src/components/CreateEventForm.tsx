'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'

type OrgOption = {
  id: string
  name: string
}

type CreateEventFormProps = {
  memberOrgs: OrgOption[]
}

export default function CreateEventForm({ memberOrgs }: CreateEventFormProps) {
  const [useExistingOrg, setUseExistingOrg] = useState(memberOrgs.length > 0)
  const [organizationId, setOrganizationId] = useState(memberOrgs[0]?.id ?? '')
  const [organizationName, setOrganizationName] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(OPPORTUNITY_CATEGORIES[0])
  const [location, setLocation] = useState('')
  const [remote, setRemote] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [volunteersNeeded, setVolunteersNeeded] = useState('10')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [facilities, setFacilities] = useState('')
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false)
  const [accessibleRestroom, setAccessibleRestroom] = useState(false)
  const [sensoryFriendly, setSensoryFriendly] = useState(false)
  const [substanceFree, setSubstanceFree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?next=/opportunities/new')
        return
      }

      let orgId = organizationId

      if (useExistingOrg) {
        if (!orgId) throw new Error('Select an organization')
      } else {
        if (!organizationName.trim()) throw new Error('Organization name is required')

        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: organizationName.trim(),
            description: `Community events hosted by ${organizationName.trim()}`,
            location: remote ? null : location.trim() || null,
            verified: false,
          })
          .select('id')
          .single()

        if (orgError) throw orgError
        orgId = org.id

        const { error: memberError } = await supabase.from('organization_members').insert({
          organization_id: orgId,
          user_id: user.id,
          role: 'owner',
        })
        if (memberError) throw memberError
      }

      const parsedCapacity = parseInt(volunteersNeeded, 10)
      if (isNaN(parsedCapacity) || parsedCapacity < 1) {
        throw new Error('Enter a valid number of spots')
      }

      // Pin the event on the map; posting still works if the address can't be found.
      let coords: { latitude: number; longitude: number } | null = null
      if (!remote && location.trim()) {
        try {
          const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(location.trim())}`)
          if (res.ok) coords = await res.json()
        } catch {
          coords = null
        }
      }

      const { data: event, error: eventError } = await supabase
        .from('opportunities')
        .insert({
          organization_id: orgId,
          posted_by: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          location: remote ? null : location.trim() || null,
          remote,
          start_date: startDate || null,
          volunteers_needed: parsedCapacity,
          volunteers_count: 0,
          time_commitment: timeCommitment.trim() || null,
          facilities: facilities.split(',').map((f) => f.trim()).filter(Boolean),
          wheelchair_accessible: wheelchairAccessible,
          accessible_restroom: accessibleRestroom,
          sensory_friendly: sensoryFriendly,
          substance_free: substanceFree,
          status: 'open',
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        })
        .select('id')
        .single()

      if (eventError) throw eventError

      trackClientEvent(APP_EVENTS.ORG_EVENT_CREATE, {
        organizationId: orgId,
        resourceType: 'opportunity',
        resourceId: event.id,
      })

      router.push(`/opportunities/${event.id}`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">
      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="border-b border-gray-100 pb-5">
        <h2 className="font-semibold text-gray-900 mb-3">Host organization</h2>
        {memberOrgs.length > 0 && (
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={useExistingOrg}
                onChange={() => setUseExistingOrg(true)}
              />
              Use my organization
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!useExistingOrg}
                onChange={() => setUseExistingOrg(false)}
              />
              Create new
            </label>
          </div>
        )}

        {useExistingOrg && memberOrgs.length > 0 ? (
          <select
            required
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {memberOrgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        ) : (
          <input
            required={!useExistingOrg || memberOrgs.length === 0}
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="Organization or group name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        )}
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Event title *</label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Park cleanup day"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="What will volunteers do? What should they bring?"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {OPPORTUNITY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Event date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={remote}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50"
            placeholder="Street address, e.g. 340 Plainfield Ave, Edison, NJ"
          />
        </div>
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Spots available *</label>
          <input
            id="capacity"
            type="number"
            min={1}
            required
            value={volunteersNeeded}
            onChange={(e) => setVolunteersNeeded(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
          Online event (no physical location)
        </label>
      </div>

      <div>
        <label htmlFor="timeCommitment" className="block text-sm font-medium text-gray-700 mb-1">Time commitment</label>
        <input
          id="timeCommitment"
          value={timeCommitment}
          onChange={(e) => setTimeCommitment(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="e.g. 3 hours, one-time"
        />
      </div>

      <div>
        <label htmlFor="facilities" className="block text-sm font-medium text-gray-700 mb-1">On-site facilities (optional)</label>
        <input
          id="facilities"
          value={facilities}
          onChange={(e) => setFacilities(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder="Restrooms, drinking water, accessible entrance"
        />
        <p className="mt-1 text-xs text-gray-500">
          Comma-separated. Shown on the event page for volunteers who need to know.
        </p>
      </div>

      <fieldset className="rounded-xl border border-gray-200 p-4 space-y-3">
        <legend className="px-1 text-sm font-semibold text-gray-900">Access and environment</legend>
        <p className="text-xs text-gray-500">
          Organizer-declared. ImpactMap does not verify these claims; label them honestly.
        </p>
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={wheelchairAccessible} onChange={(e) => setWheelchairAccessible(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700" />
          Wheelchair accessible
        </label>
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={accessibleRestroom} onChange={(e) => setAccessibleRestroom(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700" />
          Accessible restroom
        </label>
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={sensoryFriendly} onChange={(e) => setSensoryFriendly(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700" />
          Sensory-friendly / quiet space
        </label>
        <label className="flex items-start gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={substanceFree} onChange={(e) => setSubstanceFree(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-700" />
          Alcohol- and smoke-free
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
      >
        {loading ? 'Publishing…' : 'Publish event'}
      </button>
    </form>
  )
}
