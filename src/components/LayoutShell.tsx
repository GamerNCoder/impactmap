'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrackPageView from '@/components/TrackPageView'

const MINIMAL_ROUTES = ['/auth', '/onboarding']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMinimal = MINIMAL_ROUTES.some((route) => pathname.startsWith(route))

  if (isMinimal) {
    return <>{children}</>
  }

  return (
    <>
      <TrackPageView />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
