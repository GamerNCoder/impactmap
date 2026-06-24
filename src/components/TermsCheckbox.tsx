'use client'

import Link from 'next/link'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

type TermsCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  error?: string | null
  id?: string
}

export default function TermsCheckbox({
  checked,
  onChange,
  error,
  id = 'terms',
}: TermsCheckboxProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          required
        />
        <span className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          I agree to the{' '}
          <Link href="/terms" target="_blank" className="text-emerald-600 hover:underline font-medium">
            Terms &amp; Conditions
          </Link>{' '}
          and acknowledge that ImpactMap may store and use my profile information to match me with
          volunteer opportunities (version {CURRENT_TERMS_VERSION}).
          <span className="text-red-500 ml-0.5">*</span>
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function setTermsPendingCookie(version: string) {
  document.cookie = `impactmap_terms_pending=${encodeURIComponent(version)}; path=/; max-age=600; SameSite=Lax`
}

export function clearTermsPendingCookie() {
  document.cookie = 'impactmap_terms_pending=; path=/; max-age=0; SameSite=Lax'
}
