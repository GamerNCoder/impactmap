'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import QrScanLauncher from '@/components/QrScanLauncher'

const PRIMARY_NAV = [
  { href: '/opportunities', label: 'Events' },
  { href: '/dashboard', label: 'Home' },
  { href: '/passport', label: 'My hours' },
  { href: '/opportunities/new', label: 'Host an event' },
]

const GUEST_NAV = [
  { href: '/opportunities', label: 'Events' },
  { href: '/verify', label: 'Check a code' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/safety', label: 'Safety' },
]

function AccountMenu({ onSignOut }: { onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const items = [{ href: '/profile', label: 'Profile' }]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 motion-focus-ring"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
      {open && (
        <div
          id="account-menu"
          role="menu"
          className="absolute right-0 top-full mt-1 w-44 py-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg z-50 motion-nav-dropdown"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                pathname.startsWith(item.href)
                  ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
          <button
            type="button"
            onClick={() => { setOpen(false); onSignOut() }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function MobileMenu({
  user,
  onSignOut,
  linkClass,
}: {
  user: { id: string } | null
  onSignOut: () => void
  linkClass: (href: string) => string
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const links = user
    ? [...PRIMARY_NAV, { href: '/verify', label: 'Check a code' }]
    : GUEST_NAV

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 motion-focus-ring"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 top-14 bg-black/20 z-40" onClick={() => setOpen(false)} />
          <div id="mobile-menu" className="absolute left-0 right-0 top-14 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-lg z-50 px-4 py-3 space-y-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm ${linkClass(item.href)}`}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${linkClass('/profile')}`}>
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => { setOpen(false); onSignOut() }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="pt-2 flex gap-2">
                <Link href="/auth/login" onClick={() => setOpen(false)} className="flex-1 text-center py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700">
                  Sign in
                </Link>
                <Link href="/auth/signup" onClick={() => setOpen(false)} className="flex-1 text-center py-2 rounded-lg text-sm bg-emerald-700 text-white font-medium">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function Navbar() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== '/' && !href.startsWith('/#') && pathname.startsWith(href))
    return active
      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
  }


  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-200/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-1 sm:gap-2">
            <Logo size="sm" />

            {user ? (
              <div className="hidden md:flex items-center">
                {PRIMARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${linkClass(item.href)}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="hidden md:flex items-center">
                {GUEST_NAV.map((item) => (
                  <Link key={item.href} href={item.href} className={`px-3 py-2 rounded-lg text-sm ${linkClass(item.href)}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <MobileMenu user={user} onSignOut={handleLogout} linkClass={linkClass} />
          </div>

          <div className="flex items-center gap-1">
            <QrScanLauncher variant="icon" />
            <ThemeToggle />
            {loading ? (
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ) : user ? (
              <AccountMenu onSignOut={handleLogout} />
            ) : (
              <Link
                href="/auth/signup"
                className="hidden sm:inline-flex text-sm font-semibold bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors"
              >
                Get started
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
