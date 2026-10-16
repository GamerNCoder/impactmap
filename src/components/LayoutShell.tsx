'use client'

import { usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TrackPageView from '@/components/TrackPageView'

const MINIMAL_ROUTES = ['/auth', '/onboarding', '/passport/report']

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMinimal = MINIMAL_ROUTES.some((route) => pathname.startsWith(route))

  if (isMinimal) {
    return <>{children}</>
  }

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-emerald-700 focus:text-white focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <TrackPageView />
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  )
}
