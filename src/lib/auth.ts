import type { Provider } from '@supabase/supabase-js'

export type OAuthProviderId = 'google' | 'apple' | 'github' | 'azure'

export const OAUTH_PROVIDERS: { id: OAuthProviderId; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'github', label: 'GitHub' },
  { id: 'azure', label: 'Microsoft' },
]

export function getAuthCallbackUrl(origin: string, next = '/dashboard'): string {
  const url = new URL('/auth/callback', origin)
  url.searchParams.set('next', next)
  return url.toString()
}

export function getOAuthErrorMessage(error: string | null): string | null {
  if (!error) return null
  const decoded = decodeURIComponent(error.replace(/\+/g, ' '))
  if (decoded.toLowerCase().includes('provider is not enabled')) {
    return 'This sign-in provider is not configured yet. Try email sign-in or contact support.'
  }
  return decoded
}
