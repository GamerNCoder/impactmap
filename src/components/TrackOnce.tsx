'use client'

import { useEffect, useRef } from 'react'
import { trackClientEvent } from '@/lib/track-client'
import type { AppEventName } from '@/lib/app-events'

type TrackOnceProps = {
  event: AppEventName
  organizationId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

/** Invisible one-shot event — no UI. */
export default function TrackOnce({
  event,
  organizationId,
  resourceType,
  resourceId,
  metadata,
}: TrackOnceProps) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    trackClientEvent(event, { organizationId, resourceType, resourceId, metadata })
  }, [event, organizationId, resourceType, resourceId, metadata])

  return null
}
