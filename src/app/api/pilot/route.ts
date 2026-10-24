import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_MESSAGE = 2000
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ROLES = new Set(['counselor', 'teacher', 'organizer', 'student', 'other'])

const RATE_LIMIT_WINDOW_MS = 10 * 60_000
const RATE_LIMIT_MAX = 5
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const ip = forwarded.split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const organizationName = text(body.organizationName, 160)
  const contactName = text(body.contactName, 120)
  const email = text(body.email, 200)
  const role = text(body.role, 40)
  const message = text(body.message, MAX_MESSAGE)

  if (!organizationName || !contactName || !EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      { error: 'Please add your organization, your name and a valid email.' },
      { status: 400 }
    )
  }
  if (role && !ROLES.has(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from('pilot_requests').insert({
    organization_name: organizationName,
    contact_name: contactName,
    email,
    role: role || null,
    message: message || null,
  })

  if (error) {
    return NextResponse.json(
      { error: 'We could not save your request. Please try again, or email us.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
