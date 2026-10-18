// Informational weather outlook for an in-person event, from Open-Meteo (keyless).
//
// It is a flag, not a promise: no notifications (there is no email/push provider), and the whole
// thing degrades to null on any missing input, network error or missing forecast day, so the
// event page never depends on it.

export type WeatherRisk = {
  level: 'watch' | 'warn'
  label: string
  detail: string
}

export type EventWeather = {
  date: string
  risks: WeatherRisk[]
  highC: number | null
  rainChance: number | null
  windKmh: number | null
}

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'

export async function getEventWeather(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  date: string | null | undefined
): Promise<EventWeather | null> {
  if (latitude == null || longitude == null || !date) return null

  try {
    const url = new URL(FORECAST_BASE)
    url.searchParams.set('latitude', String(latitude))
    url.searchParams.set('longitude', String(longitude))
    url.searchParams.set('daily', 'precipitation_probability_max,wind_speed_10m_max,temperature_2m_max')
    url.searchParams.set('timezone', 'auto')
    url.searchParams.set('start_date', date)
    url.searchParams.set('end_date', date)

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const json = (await res.json()) as {
      daily?: {
        time?: string[]
        precipitation_probability_max?: (number | null)[]
        wind_speed_10m_max?: (number | null)[]
        temperature_2m_max?: (number | null)[]
      }
    }

    const index = json.daily?.time?.indexOf(date) ?? -1
    if (!json.daily || index < 0) return null

    const rainChance = json.daily.precipitation_probability_max?.[index] ?? null
    const windKmh = json.daily.wind_speed_10m_max?.[index] ?? null
    const highC = json.daily.temperature_2m_max?.[index] ?? null

    const risks: WeatherRisk[] = []
    if (rainChance != null && rainChance >= 50) {
      risks.push({
        level: rainChance >= 70 ? 'warn' : 'watch',
        label: `${rainChance}% chance of rain`,
        detail: 'Plan a wet-weather backup or ask volunteers to bring rain gear.',
      })
    }
    if (windKmh != null && windKmh >= 40) {
      risks.push({
        level: 'watch',
        label: `Gusts up to ${Math.round(windKmh)} km/h`,
        detail: 'Secure tents, signs and loose equipment.',
      })
    }
    if (highC != null && highC >= 32) {
      risks.push({
        level: 'watch',
        label: `High of ${Math.round(highC)}°C`,
        detail: 'Plan shade, breaks and drinking water.',
      })
    }
    if (highC != null && highC <= 0) {
      risks.push({
        level: 'watch',
        label: `High of ${Math.round(highC)}°C`,
        detail: 'Freezing conditions — dress in layers.',
      })
    }

    return { date, risks, highC, rainChance, windKmh }
  } catch {
    return null
  }
}
