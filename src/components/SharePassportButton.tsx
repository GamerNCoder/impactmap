'use client'

import { useState } from 'react'

type SharePassportButtonProps = {
  volunteerId: string
  variant?: 'dark' | 'light'
}

export default function SharePassportButton({ volunteerId, variant = 'dark' }: SharePassportButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/volunteers/${volunteerId}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link to share your Impact Passport:', url)
    }
  }

  const buttonClass =
    variant === 'light'
      ? 'inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'
      : 'inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'

  return (
    <button
      type="button"
      onClick={handleShare}
      className={buttonClass}
    >
      {copied ? 'Link copied!' : 'Share public passport'}
    </button>
  )
}
