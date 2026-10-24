'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Registers the service worker and rescues offline check-ins.
 *
 * The check-in page (/checkin/[id]) records attendance with a server-side `check_in_event`
 * RPC during render, so when a student scans the QR at a park with no signal the page cannot
 * run at all. This component closes that gap. There are two ways a check-in gets queued, and
 * one queue (`localStorage[PENDING_CHECKINS_KEY]`) that this component owns:
 *
 *  1. public/sw.js serves a generated offline document for navigations to /checkin/<id> that
 *     appends the event id to the queue itself. Nothing is reported as recorded there.
 *  2. The in-app QR scanner check-in is a client-side route change, so the worker instead
 *     observes it fail and posts CHECK_IN_UNREACHABLE back here; `queueCheckIn` appends it.
 *
 * The queue is then replayed through the same authenticated `check_in_event` RPC (which is
 * idempotent: it answers `already` for a repeat) whenever the browser is online, and an entry
 * is removed only after the server confirms it.
 *
 * Nothing here ever claims a check-in was recorded unless the server said so.
 */

/** Keep in sync with PENDING_CHECKINS_KEY in public/sw.js. */
export const PENDING_CHECKINS_KEY = 'impactmap:pending-checkins'

/** Keep in sync with CHECK_IN_UNREACHABLE in public/sw.js. */
const CHECK_IN_UNREACHABLE = 'impactmap:check-in-unreachable'

const SW_URL = '/sw.js'
const MAX_PENDING = 20
const OPPORTUNITY_ID = /^[A-Za-z0-9_-]{1,64}$/

type PendingCheckIn = {
  opportunityId: string
  queuedAt: number
  /** Supabase user id captured when the check-in was queued, when we could read it. */
  userHint: string | null
}

type Notice = { kind: 'info' | 'success' | 'error'; message: string }

function readQueue(): PendingCheckIn[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(PENDING_CHECKINS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const queue: PendingCheckIn[] = []
    for (const item of parsed) {
      if (typeof item !== 'object' || item === null) continue
      const record = item as Record<string, unknown>
      const id = record.opportunityId
      if (typeof id !== 'string' || !OPPORTUNITY_ID.test(id)) continue
      queue.push({
        opportunityId: id,
        queuedAt: typeof record.queuedAt === 'number' ? record.queuedAt : 0,
        userHint: typeof record.userHint === 'string' ? record.userHint : null,
      })
    }
    return queue.slice(-MAX_PENDING) // the queue is append-ordered: keep the newest
  } catch {
    return []
  }
}

function writeQueue(queue: PendingCheckIn[]): void {
  try {
    if (queue.length === 0) window.localStorage.removeItem(PENDING_CHECKINS_KEY)
    else window.localStorage.setItem(PENDING_CHECKINS_KEY, JSON.stringify(queue))
  } catch {
    // Storage disabled/full (private mode): the queue simply stays as it is.
  }
}

export default function ServiceWorkerRegister() {
  const [notice, setNotice] = useState<Notice | null>(null)
  const replaying = useRef(false)

  const replay = useCallback(async () => {
    if (typeof window === 'undefined' || replaying.current) return
    const queue = readQueue()
    if (queue.length === 0) return

    if (navigator.onLine === false) {
      setNotice({
        kind: 'info',
        message:
          'You are offline. Your check-in is saved on this device and will be sent as soon as you have signal.',
      })
      return
    }

    replaying.current = true
    try {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setNotice({
          kind: 'info',
          message:
            'A check-in is saved on this device. Sign in to ImpactMap and it will be sent automatically.',
        })
        return
      }

      const remaining: PendingCheckIn[] = []
      let sent = 0
      let deferred = 0
      let forAnotherAccount = 0
      let refused = 0

      for (const item of queue) {
        if (item.userHint && item.userHint !== session.user.id) {
          // Queued while a different account was signed in on this device: do not check this
          // user in for an event they did not scan. Keep it until that account signs in.
          remaining.push(item)
          forAnotherAccount += 1
          continue
        }

        const { data, error } = await supabase.rpc(
          'check_in_event',
          { p_opportunity_id: item.opportunityId }
        )

        if (error) {
          // Transport/unknown failure: keep it queued and try again later.
          remaining.push(item)
          deferred += 1
          continue
        }

        const outcome = (data ?? {}) as { ok?: boolean; already?: boolean }
        if (outcome.ok || outcome.already) {
          // `already` means the server had it (for example the student also re-opened the
          // check-in link while online), so the entry is done either way.
          sent += 1
          continue
        }

        // The server answered but refused the check-in (event closed, not eligible, ...).
        // Retrying cannot help, so drop it and say so plainly.
        refused += 1
      }

      writeQueue(remaining)

      if (forAnotherAccount > 0) {
        setNotice({
          kind: 'error',
          message:
            'A saved check-in is waiting for the account that was signed in when it was scanned. Sign back in to that account to send it.',
        })
      } else if (refused > 0) {
        setNotice({
          kind: 'error',
          message:
            'We could not record your saved check-in. Tell the organizer at the sign-in table so your hours are not lost.',
        })
      } else if (deferred > 0) {
        setNotice({
          kind: 'info',
          message:
            'Your saved check-in is still waiting — ImpactMap could not be reached. We will try again automatically.',
        })
      } else if (sent > 0) {
        setNotice({
          kind: 'success',
          message: 'Your saved check-in was sent. The organizer can now see that you attended.',
        })
      }
    } finally {
      replaying.current = false
    }
  }, [])

  /**
   * Appends a check-in that could not be sent. `userHint` records which account was signed in
   * on this device, so the replay can refuse to check a different account in later.
   */
  const queueCheckIn = useCallback(
    async (opportunityId: string) => {
      let userHint: string | null = null
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        userHint = session?.user.id ?? null
      } catch {
        userHint = null
      }

      const queue = readQueue().filter((item) => item.opportunityId !== opportunityId)
      queue.push({ opportunityId, queuedAt: Date.now(), userHint })
      writeQueue(queue.slice(-MAX_PENDING))

      setNotice({
        kind: 'info',
        message:
          'ImpactMap could not be reached, so this check-in has not been sent yet. It is saved on this device and will be sent as soon as you have signal.',
      })

      // If the network is actually back, the replay turns that notice into a confirmed one.
      void replay()
    },
    [replay]
  )

  // The worker reports a failed in-app check-in (QR scan while offline) here.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      const data: unknown = event.data
      if (typeof data !== 'object' || data === null) return
      const message = data as { type?: unknown; opportunityId?: unknown }
      if (message.type !== CHECK_IN_UNREACHABLE) return
      if (typeof message.opportunityId !== 'string' || !OPPORTUNITY_ID.test(message.opportunityId)) {
        return
      }
      void queueCheckIn(message.opportunityId)
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [queueCheckIn])

  // Register the worker: production builds only, and only on a secure origin (https or
  // localhost). A worker served over plain http would be ignored anyway.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    if (typeof window === 'undefined' || !window.isSecureContext) return

    navigator.serviceWorker
      .register(SW_URL, { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // Best effort: ImpactMap works without offline support.
      })
  }, [])

  // Replay queued check-ins on load, when the connection returns, and when the tab is
  // brought back into focus (mobile browsers do not always fire `online`).
  useEffect(() => {
    // Deferred by a tick: the first replay only needs to happen once the page has painted,
    // and it must not cascade renders during the initial commit.
    const firstRun = window.setTimeout(() => {
      void replay()
    }, 0)

    const handleOnline = () => {
      void replay()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void replay()
    }

    window.addEventListener('online', handleOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearTimeout(firstRun)
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [replay])

  if (!notice) return null

  const tone =
    notice.kind === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
      : notice.kind === 'error'
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200'
        : 'border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100'

  return (
    <div
      role={notice.kind === 'error' ? 'alert' : 'status'}
      className={`fixed bottom-4 left-1/2 z-[150] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg motion-fade-in-up ${tone}`}
    >
      <div className="flex items-start gap-3">
        <p className="flex-1">{notice.message}</p>
        <button
          type="button"
          onClick={() => setNotice(null)}
          aria-label="Dismiss check-in message"
          className="shrink-0 rounded-lg px-3 py-1.5 font-semibold text-emerald-700 hover:underline dark:text-emerald-400 motion-focus-ring"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
