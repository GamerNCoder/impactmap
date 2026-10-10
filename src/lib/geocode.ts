/** Reverse geocode coordinates into a human-readable city, state label. */

export type GeocodeAddress = {
  city?: string
  town?: string
  village?: string
  hamlet?: string
  municipality?: string
  borough?: string
  suburb?: string
  neighbourhood?: string
  county?: string
  state?: string
  country?: string
  country_code?: string
}

export type NominatimReverseResponse = {
  display_name?: string
  address?: GeocodeAddress
}

const COORDINATE_PATTERN = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/

export function looksLikeCoordinates(value: string): boolean {
  return COORDINATE_PATTERN.test(value.trim())
}

/** Prefer "City, State" — never return raw lat/lon. */
export function formatCityStateLabel(
  data: NominatimReverseResponse
): string | null {
  const a = data.address
  if (!a) {
    const parts = data.display_name?.split(',').map((p) => p.trim()).filter(Boolean) ?? []
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`
    }
    return parts[0] ?? null
  }

  const locality =
    a.city ||
    a.town ||
    a.village ||
    a.hamlet ||
    a.municipality ||
    a.borough ||
    a.suburb ||
    a.neighbourhood ||
    (a.county?.replace(/\s+County$/i, '') ?? null)

  const state = a.state?.replace(/\s+County$/i, '').trim()

  if (locality && state) {
    return `${locality}, ${state}`
  }
  if (locality) return locality
  if (state) return state

  const parts = data.display_name?.split(',').map((p) => p.trim()).filter(Boolean) ?? []
  if (parts.length >= 2) {
    return `${parts[0]}, ${parts[1]}`
  }
  return parts[0] ?? null
}

export async function reverseGeocodeCoordinates(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('format', 'json')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lon))
    url.searchParams.set('zoom', '10')
    url.searchParams.set('addressdetails', '1')

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en',
        'User-Agent': 'ImpactMap/1.0 (https://impactmap.app; contact@impactmap.app)',
      },
      next: { revalidate: 86400 },
    })

    if (!res.ok) return null

    const data = (await res.json()) as NominatimReverseResponse
    return formatCityStateLabel(data)
  } catch {
    return null
  }
}
