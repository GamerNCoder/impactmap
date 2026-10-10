'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/** Highlights pending verification forms for a scanned volunteer passport. */
export default function ManageVolunteerFocus() {
  const searchParams = useSearchParams()
  const volunteerId = searchParams.get('volunteer')

  useEffect(() => {
    if (!volunteerId) return
    const nodes = document.querySelectorAll(`[data-volunteer-id="${volunteerId}"]`)
    if (nodes.length === 0) return
    const first = nodes[0]
    first.scrollIntoView({ behavior: 'smooth', block: 'center' })
    nodes.forEach((node) => {
      node.classList.add('ring-2', 'ring-emerald-500', 'ring-offset-2')
    })
    const timer = window.setTimeout(() => {
      nodes.forEach((node) => {
        node.classList.remove('ring-2', 'ring-emerald-500', 'ring-offset-2')
      })
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [volunteerId])

  return null
}
