'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, LayerGroup } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import EventCard from '@/components/EventCard'
import { useTheme } from '@/components/ThemeProvider'
import type { Dictionary } from '@/lib/i18n'

export type ExplorerEvent = {
  id: string
  title: string
  category: string
  location: string | null
  remote: boolean
  organizationName: string | null
  verified: boolean
  volunteersNeeded: number | null
  volunteersCount: number
  startDate: string | null
  latitude: number | null
  longitude: number | null
  wheelchairAccessible?: boolean
  accessibleRestroom?: boolean
  sensoryFriendly?: boolean
  substanceFree?: boolean
}

type Position = { lat: number; lng: number }

// Default view: Edison, NJ (NJ-6).
const DEFAULT_CENTER: [number, number] = [40.5187, -74.3876]

// Straight-line radius for the "reachable without a car" filter — a walkable/bikeable distance,
// not a transit itinerary (that would need a routing engine).
const WALK_MI = 3

function milesBetween(a: Position, b: Position): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 3958.8 * 2 * Math.asin(Math.sqrt(h))
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export default function EventsExplorer({ events, dict }: { events: ExplorerEvent[]; dict: Dictionary }) {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const meLayer = useRef<LayerGroup | null>(null)
  const [me, setMe] = useState<Position | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [walkOnly, setWalkOnly] = useState(false)
  const { resolvedTheme } = useTheme()

  const pinned = useMemo(
    () => events.filter((e) => e.latitude != null && e.longitude != null),
    [events]
  )

  const sorted = useMemo(() => {
    const withDistance = events.map((e) => ({
      event: e,
      distance:
        me && e.latitude != null && e.longitude != null
          ? milesBetween(me, { lat: e.latitude, lng: e.longitude })
          : null,
    }))
    if (!me) return withDistance
    // Nearest first; online events after in-person ones.
    return withDistance.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
  }, [events, me])

  const visible = useMemo(
    () => (walkOnly && me ? sorted.filter((s) => s.distance != null && s.distance <= WALK_MI) : sorted),
    [sorted, walkOnly, me]
  )

  const toggleWalkOnly = () => {
    const next = !walkOnly
    const nextCount = next
      ? sorted.filter((s) => s.distance != null && s.distance <= WALK_MI).length
      : events.length
    setWalkOnly(next)
    setAnnouncement(next ? dict.events.filterOn : dict.events.filterOff)
  }

  useEffect(() => {
    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return
      const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
        className: resolvedTheme === 'dark' ? 'map-tiles-dark' : undefined,
      }).addTo(map)
      for (const e of pinned) {
        L.circleMarker([e.latitude!, e.longitude!], {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: '#059669',
          fillOpacity: 1,
        })
          .bindPopup(
            `<strong>${escapeHtml(e.title)}</strong><br/>${escapeHtml(e.organizationName ?? '')}` +
              `<br/><a href="/opportunities/${e.id}">View &amp; join →</a>`
          )
          .addTo(map)
      }
      if (pinned.length > 1) {
        map.fitBounds(L.latLngBounds(pinned.map((e) => [e.latitude!, e.longitude!])), { padding: [40, 40], maxZoom: 13 })
      } else if (pinned.length === 1) {
        map.setView([pinned[0].latitude!, pinned[0].longitude!], 13)
      }
      meLayer.current = L.layerGroup().addTo(map)
      mapRef.current = map
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [pinned, resolvedTheme])

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError(dict.events.noLocation)
      return
    }
    setLocating(true)
    setLocateError(null)
    setAnnouncement('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMe(here)
        setLocating(false)
        setAnnouncement(
          `Sorted ${events.length} event${events.length === 1 ? '' : 's'} by distance from you. Nearest first.`
        )
        const L = await import('leaflet')
        meLayer.current?.clearLayers()
        if (meLayer.current) {
          L.circleMarker([here.lat, here.lng], { radius: 7, color: '#ffffff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 })
            .bindTooltip('You')
            .addTo(meLayer.current)
        }
        mapRef.current?.setView([here.lat, here.lng], 12)
      },
      () => {
        setLocating(false)
        setLocateError(dict.events.locationOff)
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div ref={mapEl} className="h-64 sm:h-80 w-full bg-gray-100 dark:bg-gray-900 z-0" aria-label="Map of volunteer events" role="region" />
        <div className="absolute top-3 right-3 z-[1000] flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="bg-white text-gray-900 shadow-md px-3 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-50 disabled:opacity-60"
          >
            {locating ? dict.events.locating : me ? `✓ ${dict.events.sorted}` : `📍 ${dict.events.near}`}
          </button>
          {me && (
            <button
              type="button"
              onClick={toggleWalkOnly}
              aria-pressed={walkOnly}
              className={`shadow-md px-3 py-2 rounded-xl text-sm font-semibold ${
                walkOnly ? 'bg-emerald-700 text-white' : 'bg-white text-gray-900 hover:bg-emerald-50'
              }`}
            >
              {walkOnly ? `✓ ${dict.events.within}` : `🚶 ${dict.events.within}`}
            </button>
          )}
        </div>
      </div>
      {locateError && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">{locateError}</p>}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {dict.events.mapNote}
      </p>
      <ul className="sr-only">
        {pinned.map((e) => (
          <li key={e.id}>
            <a href={`/opportunities/${e.id}`}>{e.title}</a>
            {e.location ? ` — ${e.location}` : ''}
            {e.organizationName ? ` (${e.organizationName})` : ''}
          </li>
        ))}
      </ul>
      {walkOnly && me && visible.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {dict.events.noNearby}
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map(({ event: e, distance }) => (
          <EventCard
            key={e.id}
            id={e.id}
            title={e.title}
            category={e.category}
            location={e.location}
            remote={e.remote}
            organizationName={e.organizationName}
            verified={e.verified}
            volunteersNeeded={e.volunteersNeeded}
            volunteersCount={e.volunteersCount}
            startDate={e.startDate}
            distanceMi={distance}
            wheelchairAccessible={e.wheelchairAccessible}
            accessibleRestroom={e.accessibleRestroom}
            sensoryFriendly={e.sensoryFriendly}
            substanceFree={e.substanceFree}
            dict={dict}
          />
        ))}
      </div>
    </div>
  )
}
