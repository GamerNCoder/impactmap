import type { Provider } from '@supabase/supabase-js'

export type OAuthProviderId = 'google' | 'apple' | 'azure'

const ALL_OAUTH_PROVIDERS: { id: OAuthProviderId; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'azure', label: 'Microsoft' },
]

const DEFAULT_OAUTH_PROVIDERS = 'google,apple,azure'

const VALID_PROVIDER_IDS = new Set<OAuthProviderId>(
  ALL_OAUTH_PROVIDERS.map((p) => p.id)
)

/** @deprecated Use getEnabledOAuthProviders() — only explicitly enabled providers should be shown. */
export const OAUTH_PROVIDERS = ALL_OAUTH_PROVIDERS

/**
 * OAuth providers shown on login/signup. Defaults to Google, Apple, and Microsoft.
 * Override with NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS (comma-separated).
 */
export function getEnabledOAuthProviders(): { id: OAuthProviderId; label: string }[] {
  const raw = process.env.NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS ?? DEFAULT_OAUTH_PROVIDERS
  const ids = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((id) => id !== 'github')
    .filter((id): id is OAuthProviderId => VALID_PROVIDER_IDS.has(id as OAuthProviderId))

  return ALL_OAUTH_PROVIDERS.filter((p) => ids.includes(p.id))
}

export function hasEnabledOAuthProviders(): boolean {
  return getEnabledOAuthProviders().length > 0
}

export function isOAuthProviderEnabled(provider: OAuthProviderId): boolean {
  return getEnabledOAuthProviders().some((p) => p.id === provider)
}

export function getAuthCallbackUrl(origin: string, next = '/dashboard'): string {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('next', next)
  return url.toString()
}

export function getOAuthErrorMessage(error: string | null): string | null {
  if (!error) return null
  const decoded = decodeURIComponent(error.replace(/\+/g, ' '))

  if (
    decoded.toLowerCase().includes('provider is not enabled') ||
    decoded.toLowerCase().includes('unsupported provider') ||
    decoded.includes('validation_failed')
  ) {
    return 'Social sign-in is not available. Please use email and password instead.'
  }

  return decoded
}

export type { Provider }
