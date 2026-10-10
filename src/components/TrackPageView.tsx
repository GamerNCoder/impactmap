'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

const SKIP_PREFIXES = ['/auth/callback', '/_next', '/api']

export default function TrackPageView() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return
    if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return

    lastPath.current = pathname
    trackClientEvent(APP_EVENTS.PAGE_VIEW, {
      metadata: { referrer: document.referrer ? 'external' : 'internal' },
    })
  }, [pathname])

  return null
}
