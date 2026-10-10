'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ImpactCopilot from '@/components/ImpactCopilot'
import TrackPageView from '@/components/TrackPageView'

const MINIMAL_ROUTES = ['/auth', '/onboarding']
const NO_COPILOT_ROUTES = ['/auth', '/onboarding', '/verify']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState(false)
  const supabase = createClient()

  const isMinimal = MINIMAL_ROUTES.some((route) => pathname.startsWith(route))
  const showCopilot = user && !NO_COPILOT_ROUTES.some((route) => pathname.startsWith(route))

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(!!u))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  if (isMinimal) {
    return <>{children}</>
  }

  return (
    <>
      <TrackPageView />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      {showCopilot && <ImpactCopilot />}
    </>
  )
}
