'use client'

import { useEffect, useState } from 'react'

// "Near the event": cafés, food and transit within an 800 m walk, from OpenStreetMap via Overpass.
//
// The Overpass query is proxied by /api/nearby (server-side) rather than called from the browser:
// the mirrors are inconsistent about CORS, and the app's CSP would otherwise have to allow each
// one. The card renders nothing on failure or when there is nothing nearby, so the event page
// never waits on it.

type Place = { name: string; category: string; distanceMi: number }

export default function NearTheEvent({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [places, setPlaces] = useState<Place[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/nearby?lat=${latitude}&lng=${longitude}`)
      .then((res) => (res.ok ? res.json() : { places: [] }))
      .then((data: { places?: Place[] }) => {
        if (!cancelled) setPlaces(Array.isArray(data.places) ? data.places : [])
      })
      .catch(() => {
        if (!cancelled) setPlaces([])
      })
    return () => {
      cancelled = true
    }
  }, [latitude, longitude])

  if (!places || places.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Near the event</h2>
      <p className="text-xs text-gray-500 mb-3">Within an 800 m walk · OpenStreetMap</p>
      <ul className="space-y-2">
        {places.map((place, i) => (
          <li key={`${place.category}-${place.name}-${i}`} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-900 truncate">{place.name}</span>
            <span className="text-gray-500 text-xs whitespace-nowrap">
              {place.category} · {place.distanceMi < 0.1 ? 'here' : `${place.distanceMi.toFixed(1)} mi`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
