'use client'

import { useState } from 'react'

type ShareLinkButtonProps = {
  url: string
  label?: string
  variant?: 'light' | 'dark'
}

export default function ShareLinkButton({ url, label = 'Share link', variant = 'dark' }: ShareLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ImpactMap', url: fullUrl })
        return
      }
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', fullUrl)
    }
  }

  const className =
    variant === 'light'
      ? 'text-sm font-medium text-emerald-600 hover:underline'
      : 'inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white'

  return (
    <button type="button" onClick={handleShare} className={className}>
      {copied ? 'Copied!' : label}
    </button>
  )
}
