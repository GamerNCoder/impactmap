import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { APP_EVENTS, isAppEventName } from '@/lib/app-events'
import { trackAppEvent } from '@/lib/track-event'
import { sanitizeText } from '@/lib/security'

const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 200
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRate(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || now > entry.reset) {
    rateMap.set(userId, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

const CLIENT_ALLOWED: Set<string> = new Set([
  APP_EVENTS.PAGE_VIEW,
  APP_EVENTS.OPPORTUNITY_VIEW,
  APP_EVENTS.OPPORTUNITY_JOIN,
  APP_EVENTS.MATCHES_VIEW,
  APP_EVENTS.PASSPORT_VIEW,
  APP_EVENTS.PUBLIC_PASSPORT_VIEW,
  APP_EVENTS.APPLICATION_SUBMIT,
  APP_EVENTS.HOURS_LOG,
  APP_EVENTS.PROFILE_UPDATE,
  APP_EVENTS.ONBOARDING_COMPLETE,
  APP_EVENTS.COMPETENCY_START,
  APP_EVENTS.COMPETENCY_COMPLETE,
  APP_EVENTS.ID_SUBMIT,
  APP_EVENTS.ORG_COORDINATOR_REQUEST,
  APP_EVENTS.MESSAGE_SEND,
  APP_EVENTS.GROUP_JOIN,
  APP_EVENTS.GROUP_CREATE,
  APP_EVENTS.FORUM_POST,
  APP_EVENTS.SHARE_POST,
  APP_EVENTS.TRANSFER_CREATE,
  APP_EVENTS.TRANSFER_RESPOND,
  APP_EVENTS.REVIEW_SUBMIT,
  APP_EVENTS.AI_REQUEST,
  APP_EVENTS.APPLICATION_ACCEPT,
  APP_EVENTS.APPLICATION_REJECT,
  APP_EVENTS.HOURS_VERIFY,
  APP_EVENTS.COMPLETION_VERIFY,
  APP_EVENTS.AUTH_LOGIN,
  APP_EVENTS.AUTH_SIGNUP,
])

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let body: {
    event?: string
    path?: string
    organizationId?: string
    resourceType?: string
    resourceId?: string
    metadata?: Record<string, unknown>
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const event = body.event
  if (!event || !isAppEventName(event) || !CLIENT_ALLOWED.has(event)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (user && !checkRate(user.id)) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  if (event === APP_EVENTS.PUBLIC_PASSPORT_VIEW && !user) {
    await trackAppEvent({
      event,
      userId: null,
      path: body.path ? sanitizeText(body.path, 300) : null,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      metadata: body.metadata,
    })
    return NextResponse.json({ ok: true })
  }

  if (!user) {
    return new NextResponse(null, { status: 204 })
  }

  await trackAppEvent({
    event,
    userId: user.id,
    organizationId: body.organizationId,
    path: body.path ? sanitizeText(body.path, 300) : null,
    resourceType: body.resourceType,
    resourceId: body.resourceId,
    metadata: body.metadata,
  })

  return NextResponse.json({ ok: true })
}
