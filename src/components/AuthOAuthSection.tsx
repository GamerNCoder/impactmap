'use client'

import OAuthButtons from '@/components/OAuthButtons'
import { hasEnabledOAuthProviders } from '@/lib/auth'

type AuthDividerProps = {
  label: string
}

/** Shown between OAuth and email forms only when at least one OAuth provider is enabled. */
export function AuthDivider({ label }: AuthDividerProps) {
  if (!hasEnabledOAuthProviders()) {
    return null
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-300 dark:border-gray-700" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-2 bg-gray-50 dark:bg-gray-950 text-gray-500">{label}</span>
      </div>
    </div>
  )
}

export function AuthOAuthSection({
  mode,
  next,
  onBeforeOAuth,
}: {
  mode: 'signin' | 'signup'
  next?: string
  onBeforeOAuth: () => boolean
}) {
  if (!hasEnabledOAuthProviders()) {
    return null
  }

  return (
    <OAuthButtons
      mode={mode}
      next={next}
      onBeforeOAuth={onBeforeOAuth}
    />
  )
}
