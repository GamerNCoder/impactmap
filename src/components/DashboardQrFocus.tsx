'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/** Scrolls to and highlights log-hours block for a scanned event QR. */
export default function DashboardQrFocus() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get('opportunity')

  useEffect(() => {
    if (!opportunityId) return
    const el = document.querySelector(`[data-opportunity-id="${opportunityId}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2')
    const timer = window.setTimeout(() => {
      el.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2')
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [opportunityId])

  return null
}
