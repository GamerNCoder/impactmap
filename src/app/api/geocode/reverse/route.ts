import { NextResponse } from 'next/server'
import { reverseGeocodeCoordinates } from '@/lib/geocode'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get('lat'))
  const lon = Number(searchParams.get('lon'))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Coordinates out of range' }, { status: 400 })
  }

  const label = await reverseGeocodeCoordinates(lat, lon)
  if (!label) {
    return NextResponse.json(
      { error: 'Could not resolve a city and state for this location.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ label, latitude: lat, longitude: lon })
}
