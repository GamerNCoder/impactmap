import { looksLikeCoordinates } from '@/lib/geocode'

export type GeoPosition = {
  latitude: number
  longitude: number
}

export type GeoError = 'denied' | 'unavailable' | 'timeout' | 'geocode_failed' | 'unknown'

export type GeoResult =
  | { ok: true; position: GeoPosition; label: string }
  | { ok: false; error: GeoError }

function getErrorCode(err: GeolocationPositionError): GeoError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'denied'
    case err.POSITION_UNAVAILABLE:
      return 'unavailable'
    case err.TIMEOUT:
      return 'timeout'
    default:
      return 'unknown'
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`
    )
    if (!res.ok) return null
    const data = (await res.json()) as { label?: string }
    const label = data.label?.trim()
    if (!label || looksLikeCoordinates(label)) return null
    return label
  } catch {
    return null
  }
}

export function requestUserLocation(): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, error: 'unavailable' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const label = await reverseGeocode(latitude, longitude)

        if (!label) {
          resolve({ ok: false, error: 'geocode_failed' })
          return
        }

        resolve({
          ok: true,
          position: { latitude, longitude },
          label,
        })
      },
      (err) => resolve({ ok: false, error: getErrorCode(err) }),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  })
}

export function geoErrorMessage(error: GeoError): string {
  switch (error) {
    case 'denied':
      return 'Location permission denied. Enter your city and state manually or enable location in browser settings.'
    case 'unavailable':
      return 'Location unavailable on this device. Enter your city and state manually.'
    case 'timeout':
      return 'Location request timed out. Try again or enter your city and state manually.'
    case 'geocode_failed':
      return 'We found your position but could not determine your city and state. Please type them manually (e.g. Austin, Texas).'
    default:
      return 'Could not detect location. Enter your city and state manually.'
  }
}
