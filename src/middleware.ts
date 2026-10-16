import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

export async function middleware(request: NextRequest) {
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('terms_accepted_at, terms_version')
      .eq('id', user.id)
      .maybeSingle()

    const termsOk =
      profile?.terms_accepted_at && profile.terms_version === CURRENT_TERMS_VERSION

    if (!termsOk) {
      const termsUrl = new URL('/auth/accept-terms', request.url)
      termsUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(termsUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/passport/:path*',
    '/organizations/:id/manage/:path*',
    '/auth/callback',
  ],
}
