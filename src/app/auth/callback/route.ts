import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'
import { recordTermsAcceptance } from '@/lib/terms-server'

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
  const safeNext = next.startsWith('/') ? next : '/dashboard'

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('skills, terms_accepted_at, terms_version')
      .eq('id', user.id)
      .maybeSingle()

    const termsOk =
      profile?.terms_accepted_at && profile.terms_version === CURRENT_TERMS_VERSION

    if (!termsOk) {
      const redirect = NextResponse.redirect(
        `${origin}/auth/accept-terms?next=${encodeURIComponent(safeNext)}`
      )
      responseCookies.forEach(({ name, value, options }) => {
        redirect.cookies.set(name, value, options)
      })
      return redirect
    }

    if (!profile?.skills?.length) {
      const redirect = NextResponse.redirect(`${origin}/onboarding`)
      responseCookies.forEach(({ name, value, options }) => {
        redirect.cookies.set(name, value, options)
      })
      return redirect
    }
  }

  const redirect = NextResponse.redirect(`${origin}${safeNext}`)
  responseCookies.forEach(({ name, value, options }) => {
    redirect.cookies.set(name, value, options)
  })
  return redirect
}
