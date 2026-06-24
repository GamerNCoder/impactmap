import { NextResponse } from 'next/server'
import { getEnabledOAuthProviders, type OAuthProviderId } from '@/lib/auth'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://impactmap.vercel.app'

async function isProviderConfigured(provider: OAuthProviderId): Promise<boolean> {
  if (!SUPABASE_URL) return false

  const redirectTo = `${SITE_URL}/auth/callback`
  const url = new URL(`${SUPABASE_URL}/auth/v1/authorize`)
  url.searchParams.set('provider', provider)
  url.searchParams.set('redirect_to', redirectTo)

  try {
    const res = await fetch(url.toString(), { redirect: 'manual' })
    if (res.status === 400) {
      const body = await res.json().catch(() => null)
      const msg = String(body?.msg ?? body?.error ?? '')
      if (msg.toLowerCase().includes('provider is not enabled')) return false
    }
    return res.status === 200 || res.status === 302
  } catch {
    return false
  }
}

export async function GET() {
  const candidates = getEnabledOAuthProviders()
  const checks = await Promise.all(
    candidates.map(async ({ id, label }) => ({
      id,
      label,
      configured: await isProviderConfigured(id),
    }))
  )

  const providers = checks.filter((p) => p.configured).map(({ id, label }) => ({ id, label }))

  return NextResponse.json({
    providers,
    configured: providers.length > 0,
  })
}
