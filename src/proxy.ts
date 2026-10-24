import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

/** The owner's private profile row, as returned by the my_profile() RPC. */
type PrivateProfile = {
  terms_accepted_at: string | null
  terms_version: string | null
  date_of_birth: string | null
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/passport',
    '/opportunities/new',
    '/checkin',
  ]
  const isOrgManagePath = /^\/organizations\/[^/]+\/manage/.test(pathname)
  const isProtectedPath =
    protectedPaths.some((path) => pathname.startsWith(path)) || isOrgManagePath

  if (isProtectedPath && !user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isProtectedPath) {
    // authenticated is not granted SELECT on date_of_birth / terms columns beyond the public
    // set, so read the owner's own row through the SECURITY DEFINER my_profile() RPC.
    const { data } = await supabase.rpc('my_profile')
    const profile = ((data as unknown as PrivateProfile[] | null) ?? [])[0] ?? null

    const termsOk = Boolean(
      profile?.terms_accepted_at && profile.terms_version === CURRENT_TERMS_VERSION
    )

    if (!termsOk) {
      const termsUrl = new URL('/auth/accept-terms', request.url)
      termsUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(termsUrl)
    }

    // Age rule: accounts that never supplied a birthday (e.g. social sign-in) must do so
    // before they can log hours, host an event, or open their record.
    if (!profile?.date_of_birth) {
      const profileUrl = new URL('/auth/complete-profile', request.url)
      profileUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(profileUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/passport/:path*',
    '/opportunities/new/:path*',
    '/checkin/:path*',
    '/organizations/:id/manage/:path*',
    '/auth/callback',
  ],
}
