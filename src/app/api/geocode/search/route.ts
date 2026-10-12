import { NextResponse } from 'next/server'

/** Forward-geocode an event address (OpenStreetMap Nominatim) so it can be pinned on the map. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get('q')?.trim()
  if (!q || q.length > 200) {
    return NextResponse.json({ error: 'Missing address' }, { status: 400 })
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'us')
    url.searchParams.set('q', q)
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ImpactMap/1.0 (https://impactmap.vercel.app)',
      },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
    const [hit] = (await res.json()) as { lat: string; lon: string }[]
    if (!hit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ latitude: Number(hit.lat), longitude: Number(hit.lon) })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 502 })
  }
}
