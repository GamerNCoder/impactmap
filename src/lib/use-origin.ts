'use client'

import { useSyncExternalStore } from 'react'

const noopSubscribe = () => () => {}

/** window.location.origin on the client; '' on the server and during hydration (avoids mismatches). */
export function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ''
  )
}
