import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * Defensive honeypot. Not linked for users. Any hit is logged (hashed IP, UA, path) and
 * returns a plain 404. It never reads application data and never authenticates the caller.
 */
async function record(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const metadata = {
    path: new URL(request.url).pathname,
    method: request.method,
    user_agent: (request.headers.get('user-agent') ?? '').slice(0, 300),
    referer: (request.headers.get('referer') ?? '').slice(0, 300),
    ip_hash: ip ? createHash('sha256').update(ip).digest('hex') : null,
  }
  if (!url || !key) {
    console.warn('honeypot_hit', metadata)
    return
  }
  const admin = createClient(url, key, { auth: { persistSession: false } })
  await admin.from('security_audit_log').insert({
    action: 'honeypot_hit',
    resource_type: 'route',
    metadata,
  })
}

export async function GET(request: Request) {
  void record(request)
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request: Request) {
  void record(request)
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
