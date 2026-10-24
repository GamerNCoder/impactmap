import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  demoEnabled,
} from '@/lib/demo'

export const dynamic = 'force-dynamic'

/**
 * Restore the shared demo's single-use pending log so the next visitor can
 * experience the one-tap approval flow. Demo-only; the service key never
 * reaches the browser.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get('host')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  if (!demoEnabled()) {
    return NextResponse.json({ error: 'Demo is not configured.' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('reset_demo')

  if (error || !(data as { ok?: boolean } | null)?.ok) {
    return NextResponse.json({ error: 'Could not reset the demo.' }, { status: 500 })
  }

  return NextResponse.redirect(new URL('/demo?reset=1', request.url))
}
