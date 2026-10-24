'use client'

import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, LOCALE_LABELS, LOCALES, type Locale } from '@/lib/i18n'

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter()

  return (
    <label className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
      <span className="sr-only">Language / Idioma</span>
      <select
        value={locale}
        onChange={(event) => {
          const next = event.target.value
          document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
          document.documentElement.lang = next
          router.refresh()
        }}
        className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-xs"
        aria-label="Language / Idioma"
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>{LOCALE_LABELS[value]}</option>
        ))}
      </select>
    </label>
  )
}
