'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react'

export type Theme = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'impactmap-theme'

const themeListeners = new Set<() => void>()

function emitThemeChange() {
  themeListeners.forEach((listener) => listener())
}

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback)
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback()
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onMq = () => callback()
  window.addEventListener('storage', onStorage)
  mq.addEventListener('change', onMq)
  return () => {
    themeListeners.delete(callback)
    window.removeEventListener('storage', onStorage)
    mq.removeEventListener('change', onMq)
  }
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function getServerThemeSnapshot(): Theme {
  return 'system'
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getResolvedTheme(): 'light' | 'dark' {
  const theme = getStoredTheme()
  return theme === 'system' ? getSystemTheme() : theme
}

function getServerResolvedTheme(): 'light' | 'dark' {
  return 'light'
}

const subscribeNoop = () => () => {}
const isClientSnapshot = () => true
const isServerSnapshot = () => false

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, getServerThemeSnapshot)
  const resolvedTheme = useSyncExternalStore(
    subscribeTheme,
    getResolvedTheme,
    getServerResolvedTheme
  )
  const mounted = useSyncExternalStore(subscribeNoop, isClientSnapshot, isServerSnapshot)

  useEffect(() => {
    if (mounted) applyTheme(resolvedTheme)
  }, [mounted, resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    localStorage.setItem(STORAGE_KEY, next)
    emitThemeChange()
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
