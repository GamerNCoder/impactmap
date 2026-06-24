import type { AppEventName } from '@/lib/app-events'

/** Fire-and-forget client beacon — no UI, no await required by callers. */
export function trackClientEvent(
  event: AppEventName,
  payload?: {
    organizationId?: string
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, unknown>
  }
): void {
  if (typeof window === 'undefined') return

  const body = JSON.stringify({
    event,
    path: window.location.pathname,
    organizationId: payload?.organizationId,
    resourceType: payload?.resourceType,
    resourceId: payload?.resourceId,
    metadata: payload?.metadata,
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
    return
  }

  void fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  })
}
