import { NextRequest, NextResponse } from 'next/server'

// "Near the event" lookup: cafés, food and transit within an 800 m walk, from OpenStreetMap via
// Overpass. Run on the server (not in the browser) because the Overpass mirrors are inconsistent
// about CORS, and because the app's CSP would otherwise have to allow each one. Overpass needs a
// POST with a User-Agent; we try a short list of mirrors and give up quietly — the card simply
// does not render when nothing comes back.
//
// Note: overpass.osm.ch answers but is a Switzerland-only extract, so it is not used here.

export const dynamic = 'force-dynamic'
// Overpass mirrors can take several seconds; give the function room for one slow round trip.
export const maxDuration = 30

const ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

const RADIUS_M = 800
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

type Place = { name: string; category: string; distanceMi: number }
type CacheEntry = { at: number; places: Place[] }

const cache = new Map<string, CacheEntry>()

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

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'))
  const lng = Number(req.nextUrl.searchParams.get('lng'))
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ places: [] })
  }

  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ places: cached.places })
  }

  const query =
    `[out:json][timeout:8];(` +
    `node(around:${RADIUS_M},${lat},${lng})[amenity=cafe];` +
    `node(around:${RADIUS_M},${lat},${lng})[amenity=restaurant];` +
    `node(around:${RADIUS_M},${lat},${lng})[highway=bus_stop];` +
    `node(around:${RADIUS_M},${lat},${lng})[railway=station];` +
    `);out body 30;`

  // Ask every mirror at once and take the first non-empty answer. Sequentially this was slow and
  // flaky — one dead mirror could burn the whole budget — whereas in parallel the response time is
  // the fastest mirror's, and a single instance hiccup no longer empties the card.
  const attempts = ENDPOINTS.map((endpoint) => queryMirror(endpoint, query, lat, lng))
  const settled = await Promise.allSettled(attempts)
  const places = settled.find((r) => r.status === 'fulfilled' && r.value.length > 0)

  const result = places?.status === 'fulfilled' ? places.value.slice(0, 8) : []
  // Only cache a real answer, so an empty result is retried next time.
  if (result.length > 0) cache.set(key, { at: Date.now(), places: result })

  return NextResponse.json({ places: result })
}

async function queryMirror(
  endpoint: string,
  query: string,
  lat: number,
  lng: number
): Promise<Place[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'User-Agent': 'ImpactMap/1.0 (student project; https://impactmap.vercel.app)',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ data: query }).toString(),
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!res.ok) return []

    const json = (await res.json()) as {
      elements?: { lat?: number; lon?: number; tags?: Record<string, string> }[]
    }
    const places: Place[] = []
    for (const el of json.elements ?? []) {
      if (el.lat == null || el.lon == null) continue
      const category = categoryFor(el.tags)
      if (!category) continue
      places.push({
        name: el.tags?.name || category,
        category,
        distanceMi: milesBetween(lat, lng, el.lat, el.lon),
      })
    }
    places.sort((a, b) => a.distanceMi - b.distanceMi)
    return places
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
