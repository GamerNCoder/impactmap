import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_CODES = 200
const CODE_PATTERN = /^IMP-[A-Z0-9]{6,}$/

type Batch = { name?: string; verified?: boolean }

/** Best-effort per-instance rate limit. Serverless instances do not share memory. */
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
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

function normalizeCode(raw: string): string {
  const trimmed = raw.trim().toUpperCase()
  return trimmed.startsWith('IMP-') ? trimmed : `IMP-${trimmed.replace(/^IMP-?/i, '')}`
}

type Row = {
  code: string
  status: 'verified' | 'revoked' | 'unknown' | 'invalid'
  name: string | null
  event: string | null
  organization: string | null
  organizer_verified: boolean | null
  date: string | null
  hours: number | null
  approver: string | null
  type: 'hours' | 'completion' | null
}

/**
 * Bulk verification for counselors: check a whole class's codes in one request.
 * Reads only what a single /verify/[code] lookup can already see — row level
 * security limits the public read to verified hours and completed tasks.
 */
export async function POST(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const ip = forwarded.split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many lookups. Wait a minute and try again.' },
      { status: 429 }
    )
  }

  let body: { codes?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.codes)) {
    return NextResponse.json({ error: 'Send { codes: string[] }' }, { status: 400 })
  }

  const requested = body.codes
    .filter((c): c is string => typeof c === 'string')
    .map((c) => c.trim())
    .filter(Boolean)

  if (requested.length === 0) {
    return NextResponse.json({ error: 'No codes provided' }, { status: 400 })
  }
  if (requested.length > MAX_CODES) {
    return NextResponse.json(
      { error: `Please check at most ${MAX_CODES} codes at a time.` },
      { status: 413 }
    )
  }

  const invalid: Row[] = []
  const validCodes = new Set<string>()
  for (const raw of requested) {
    const code = normalizeCode(raw)
    if (CODE_PATTERN.test(code)) {
      validCodes.add(code)
    } else {
      invalid.push({
        code: raw,
        status: 'invalid',
        name: null,
        event: null,
        organization: null,
        organizer_verified: null,
        date: null,
        hours: null,
        approver: null,
        type: null,
      })
    }
  }

  const codes = [...validCodes]
  if (codes.length === 0) {
    return NextResponse.json({ ok: true, results: invalid, summary: { checked: requested.length, verified: 0 } })
  }

  const supabase = await createClient()

  const { data: found, error: lookupError } = await supabase.rpc('verify_codes', {
    p_codes: codes,
  })

  if (lookupError) {
    return NextResponse.json({ error: 'Lookup failed.' }, { status: 500 })
  }

  const rowsByCode = new Map<string, Row>()
  for (const raw of (found ?? []) as Array<Record<string, unknown>>) {
    const code = String(raw.code ?? '')
    if (!code) continue
    rowsByCode.set(code, {
      code,
      status: raw.status === 'revoked' ? 'revoked' : 'verified',
      name: (raw.name as string | null) ?? null,
      event: (raw.event as string | null) ?? null,
      organization: (raw.organization as string | null) ?? null,
      organizer_verified: (raw.organizer_verified as boolean | null) ?? null,
      date: (raw.date as string | null) ?? null,
      hours: raw.hours == null ? null : Number(raw.hours),
      approver: (raw.supervisor_name as string | null) ?? null,
      type: raw.type === 'completion' ? 'completion' : 'hours',
    })
  }

  const results: Row[] = [
    ...codes.map(
      (code): Row =>
        rowsByCode.get(code) ?? {
          code,
          status: 'unknown',
          name: null,
          event: null,
          organization: null,
          organizer_verified: null,
          date: null,
          hours: null,
          approver: null,
          type: null,
        }
    ),
    ...invalid,
  ]

  return NextResponse.json({
    ok: true,
    results,
    summary: {
      checked: results.length,
      verified: results.filter((r) => r.status === 'verified').length,
      revoked: results.filter((r) => r.status === 'revoked').length,
    },
  })
}
