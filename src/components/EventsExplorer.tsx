'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, LayerGroup } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import EventCard from '@/components/EventCard'

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
}

type Position = { lat: number; lng: number }

// Default view: Edison, NJ (NJ-6).
const DEFAULT_CENTER: [number, number] = [40.5187, -74.3876]

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

export default function EventsExplorer({ events }: { events: ExplorerEvent[] }) {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const meLayer = useRef<LayerGroup | null>(null)
  const [me, setMe] = useState<Position | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

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

  useEffect(() => {
    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return
      const map = L.map(mapEl.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
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
  }, [pinned])

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError('Your browser cannot share location.')
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
        setLocateError('Location is off. Events are still listed below.')
      },
      { timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        <div ref={mapEl} className="h-64 sm:h-80 w-full bg-gray-100 dark:bg-gray-900 z-0" aria-label="Map of volunteer events" role="region" />
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="absolute top-3 right-3 z-[1000] bg-white text-gray-900 shadow-md px-3 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-50 disabled:opacity-60"
        >
          {locating ? 'Locating…' : me ? '✓ Sorted by distance' : '📍 Near me'}
        </button>
      </div>
      {locateError && <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">{locateError}</p>}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map(({ event: e, distance }) => (
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
          />
        ))}
      </div>
    </div>
  )
}
