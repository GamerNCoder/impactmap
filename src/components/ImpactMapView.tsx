'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '@/components/ThemeProvider'

export type ImpactPoint = {
  id: string
  title: string
  category: string
  latitude: number
  longitude: number
  hours: number
}

const DEFAULT_CENTER: [number, number] = [40.5187, -74.3876]

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export default function ImpactMapView({ points }: { points: ImpactPoint[] }) {
  const mapEl = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (!mapEl.current || points.length === 0) return
    let cancelled = false
    let map: LeafletMap | null = null

    import('leaflet').then((L) => {
      if (cancelled || !mapEl.current) return
      map = L.map(mapEl.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
        className: resolvedTheme === 'dark' ? 'map-tiles-dark' : undefined,
      }).addTo(map)

      const max = Math.max(...points.map((p) => p.hours), 1)
      for (const point of points) {
        const radius = 8 + 14 * Math.sqrt(point.hours / max)
        L.circleMarker([point.latitude, point.longitude], {
          radius,
          color: '#ffffff',
          weight: 2,
          fillColor: '#059669',
          fillOpacity: 0.85,
        })
          .bindPopup(
            `<strong>${escapeHtml(point.title)}</strong><br/>` +
              `${escapeHtml(point.category)} · ${point.hours} verified hour${point.hours === 1 ? '' : 's'}`
          )
          .addTo(map!)
      }

      if (points.length > 1) {
        map.fitBounds(
          L.latLngBounds(points.map((p) => [p.latitude, p.longitude])),
          { padding: [40, 40], maxZoom: 13 }
        )
      } else {
        map.setView([points[0].latitude, points[0].longitude], 13)
      }
    })

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [points, resolvedTheme])

  if (points.length === 0) {
    return (
      <div className="h-80 w-full rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Verified hours will appear here as organizers approve them. Each approved log adds its
          event to this map.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapEl}
      className="h-80 w-full rounded-2xl"
      role="region"
      aria-label="Map of verified service hours by event"
    />
  )
}
