'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Dictionary } from '@/lib/i18n'

type LocationState = 'idle' | 'locating' | 'done' | 'denied' | 'error'

/**
 * Optional check-in trust layer. The browser sends coordinates to a SECURITY DEFINER RPC that
 * compares them with the event and returns a distance; the database stores only the distance.
 */
export default function CheckInLocation({ opportunityId, dict }: { opportunityId: string; dict: Dictionary }) {
  const [state, setState] = useState<LocationState>('idle')
  const [distance, setDistance] = useState<number | null>(null)
  const supabase = createClient()

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setState('denied')
      return
    }
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { data, error } = await supabase.rpc('record_checkin_location', {
          p_opportunity_id: opportunityId,
          p_lat: position.coords.latitude,
          p_lon: position.coords.longitude,
        })
        const result = data as { ok?: boolean; distance_m?: number | null } | null
        if (error || !result?.ok) {
          setState('error')
          return
        }
        setDistance(result.distance_m ?? null)
        setState('done')
      },
      () => setState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
      <p className="text-sm font-medium text-gray-900 dark:text-white">
        {dict.checkin.confirm}
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {dict.checkin.locationBody}
      </p>

      {state === 'idle' && (
        <button
          type="button"
          onClick={locate}
          className="mt-3 inline-flex items-center rounded-lg border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-gray-900 px-3.5 py-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 motion-pressable"
        >
          {dict.checkin.useLocation}
        </button>
      )}

      {state === 'locating' && (
        <p role="status" className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {dict.checkin.locating}
        </p>
      )}

      {state === 'done' && (
        <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">
          {distance == null
            ? dict.checkin.noCoords
            : dict.checkin.recorded.replace('{distance}', String(distance))}
        </p>
      )}

      {state === 'denied' && (
        <p role="status" className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          {dict.checkin.denied}
        </p>
      )}

      {state === 'error' && (
        <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          {dict.checkin.error}
        </p>
      )}
    </div>
  )
}
