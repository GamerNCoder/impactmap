'use client'

import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null
  return (
    <div role="status" className="bg-amber-100 text-amber-950 border-b border-amber-300 px-4 py-2 text-center text-sm">
      You&apos;re offline. Check-ins will queue on this device and sync when you reconnect.
    </div>
  )
}
