'use client'

import { useEffect, useState } from 'react'

// "Near the event": cafés, food and transit within an 800 m walk, from OpenStreetMap via Overpass.
//
// The query runs in the visitor's browser rather than on the server: the Overpass instances refuse
// many datacenter networks (Vercel's fetch got a 406 from overpass-api.de and an empty result from
// the kumi mirror), but they do send `Access-Control-Allow-Origin: *`, so the browser can call them
// directly. We try a short list of mirrors and give up quietly — the card renders nothing on
// failure or when there is nothing nearby, so the event page never waits on it.

const ENDPOINTS = [
  'https://overpass.osm.ch/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]
const RADIUS_M = 800

type Place = { name: string; category: string; distanceMi: number }

const cache = new Map<string, Place[]>()

function milesBetween(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(bLat - aLat)
  const dLon = rad(bLon - aLon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

function categoryFor(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null
  if (tags.amenity === 'cafe') return 'Cafe'
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food') return 'Food'
  if (tags.highway === 'bus_stop') return 'Bus stop'
  if (tags.railway === 'station' || tags.railway === 'halt') return 'Transit'
  return null
}

export default function NearTheEvent({ latitude, longitude }: { latitude: number; longitude: number }) {
  const [places, setPlaces] = useState<Place[] | null>(null)

  useEffect(() => {
    const key = `${latitude.toFixed(3)},${longitude.toFixed(3)}`
    let cancelled = false
    const query =
      `[out:json][timeout:8];(` +
      `node(around:${RADIUS_M},${latitude},${longitude})[amenity=cafe];` +
      `node(around:${RADIUS_M},${latitude},${longitude})[amenity=restaurant];` +
      `node(around:${RADIUS_M},${latitude},${longitude})[highway=bus_stop];` +
      `node(around:${RADIUS_M},${latitude},${longitude})[railway=station];` +
      `);out body 30;`
    const body = new URLSearchParams({ data: query }).toString()

    ;(async () => {
      const cached = cache.get(key)
      if (cached) {
        if (!cancelled) setPlaces(cached)
        return
      }
      for (const endpoint of ENDPOINTS) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
            signal: controller.signal,
          })
          if (!res.ok) continue
          const json = (await res.json()) as {
            elements?: { lat?: number; lon?: number; tags?: Record<string, string> }[]
          }
          const found: Place[] = []
          for (const el of json.elements ?? []) {
            if (el.lat == null || el.lon == null) continue
            const category = categoryFor(el.tags)
            if (!category) continue
            found.push({
              name: el.tags?.name || category,
              category,
              distanceMi: milesBetween(latitude, longitude, el.lat, el.lon),
            })
          }
          found.sort((a, b) => a.distanceMi - b.distanceMi)
          const trimmed = found.slice(0, 8)
          cache.set(key, trimmed)
          if (!cancelled) setPlaces(trimmed)
          return
        } catch {
          // try the next mirror
        } finally {
          clearTimeout(timer)
        }
      }
      if (!cancelled) setPlaces([])
    })()

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
