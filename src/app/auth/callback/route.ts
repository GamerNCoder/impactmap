import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'
import { recordTermsAcceptance } from '@/lib/terms-server'

/** The owner's private profile row, as returned by the my_profile() RPC. */
type PrivateProfile = {
  terms_accepted_at: string | null
  terms_version: string | null
  date_of_birth: string | null
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    const raw = errorDescription || error
    const friendly =
      raw.toLowerCase().includes('provider is not enabled') ||
      raw.toLowerCase().includes('unsupported provider') ||
      raw.includes('validation_failed')
        ? 'Social sign-in is not available. Please use email and password instead.'
        : raw
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(friendly)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent('Missing authentication code')}`
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const responseCookies: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  const { data: { user } } = await supabase.auth.getUser()
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  const redirectWithCookies = (path: string) => {
    const redirect = NextResponse.redirect(`${origin}${path}`)
    responseCookies.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, options)
    })
    return redirect
  }

  if (user) {
    const termsCookie = cookieStore.get('impactmap_terms_pending')?.value
    const decodedTerms = termsCookie ? decodeURIComponent(termsCookie) : null

    if (decodedTerms === CURRENT_TERMS_VERSION) {
      try {
        await recordTermsAcceptance(user.id)
        responseCookies.push({
          name: 'impactmap_terms_pending',
          value: '',
          options: { path: '/', maxAge: 0 },
        })
      } catch {
        // Fall through to accept-terms page
      }
    }

    // date_of_birth and the terms columns are not directly selectable by authenticated,
    // so read the owner's own row through the SECURITY DEFINER my_profile() RPC.
    const { data: profileRows } = await supabase.rpc('my_profile')
    const profile = ((profileRows as unknown as PrivateProfile[] | null) ?? [])[0] ?? null

    const termsOk = Boolean(
      profile?.terms_accepted_at && profile.terms_version === CURRENT_TERMS_VERSION
    )

    if (!termsOk) {
      return redirectWithCookies(`/auth/accept-terms?next=${encodeURIComponent(safeNext)}`)
    }

    // Social sign-in never collects a birthday; the age and guardian-consent rules depend on it.
    if (!profile?.date_of_birth) {
      return redirectWithCookies(`/auth/complete-profile?next=${encodeURIComponent(safeNext)}`)
    }
  }

  return redirectWithCookies(safeNext)
}
