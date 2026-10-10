'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { geoErrorMessage, requestUserLocation } from '@/lib/geolocation'
import { looksLikeCoordinates } from '@/lib/geocode'

type LocationFieldProps = {
  value: string
  onChange: (value: string) => void
  /** Request browser location permission when the field mounts */
  autoRequest?: boolean
  required?: boolean
  label?: string
  placeholder?: string
}

export default function LocationField({
  value,
  onChange,
  autoRequest = false,
  required = false,
  label = 'Your area',
  placeholder = 'e.g. Austin, Texas',
}: LocationFieldProps) {
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const autoRequested = useRef(false)
  const convertedCoords = useRef(false)

  const resolveCoordinates = useCallback(
    async (raw: string) => {
      const parts = raw.split(',').map((s) => parseFloat(s.trim()))
      if (parts.length !== 2 || !parts.every(Number.isFinite)) return false

      setLoading(true)
      setHint(null)
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${encodeURIComponent(parts[0])}&lon=${encodeURIComponent(parts[1])}`
        )
        if (!res.ok) return false
        const data = (await res.json()) as { label?: string }
        const label = data.label?.trim()
        if (!label || looksLikeCoordinates(label)) return false
        onChange(label)
        setHint(`Updated to ${label}.`)
        return true
      } catch {
        return false
      } finally {
        setLoading(false)
      }
    },
    [onChange]
  )

  const detectLocation = useCallback(async () => {
    setLoading(true)
    setHint(null)
    const result = await requestUserLocation()
    setLoading(false)
    autoRequested.current = true

    if (result.ok) {
      onChange(result.label)
      setHint(`Saved as ${result.label}.`)
    } else {
      setHint(geoErrorMessage(result.error))
    }
  }, [onChange])

  useEffect(() => {
    if (autoRequest && !value && !autoRequested.current) {
      void detectLocation()
    }
  }, [autoRequest, value, detectLocation])

  useEffect(() => {
    if (!value || convertedCoords.current || !looksLikeCoordinates(value)) return
    convertedCoords.current = true
    void resolveCoordinates(value).then((ok) => {
      if (!ok) {
        setHint('Your saved location looks like GPS coordinates. Tap Locate or enter city and state manually.')
      }
    })
  }, [value, resolveCoordinates])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-2">
        <input
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={detectLocation}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900 disabled:opacity-50"
          title="Use device location"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {loading ? '…' : 'Locate'}
        </button>
      </div>
      {hint && (
        <p className={`mt-2 text-xs ${hint.includes('denied') || hint.includes('Could not') || hint.includes('could not') ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {hint}
        </p>
      )}
      {!autoRequest && (
        <p className="mt-2 text-xs text-gray-500">Tap Locate to use your device GPS — we save city and state, not raw coordinates.</p>
      )}
    </div>
  )
}
