import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  DEMO_ORG_ID,
  DEMO_ORGANIZER_EMAIL,
  DEMO_ORGANIZER_PASSWORD,
  DEMO_STUDENT_EMAIL,
  DEMO_STUDENT_PASSWORD,
} from '@/lib/demo'

export const dynamic = 'force-dynamic'

/**
 * One-click demo sign-in. The passwords live only in server env vars; the browser never sees
 * them. The accounts are shared and deliberately writable so a judge can try the approval flow.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const { role } = await params
  const fallback = new URL('/demo', request.url)

  if (role !== 'student' && role !== 'organizer') {
    fallback.searchParams.set('error', 'unknown')
    return NextResponse.redirect(fallback)
  }

  const email = role === 'student' ? DEMO_STUDENT_EMAIL : DEMO_ORGANIZER_EMAIL
  const password = role === 'student' ? DEMO_STUDENT_PASSWORD : DEMO_ORGANIZER_PASSWORD

  if (!email || !password) {
    fallback.searchParams.set('error', 'disabled')
    return NextResponse.redirect(fallback)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    fallback.searchParams.set('error', 'unavailable')
    return NextResponse.redirect(fallback)
  }

  const destination =
    role === 'organizer'
      ? `/organizations/${DEMO_ORG_ID}/manage?demo=1`
      : '/dashboard?demo=1'

  return NextResponse.redirect(new URL(destination, request.url))
}
