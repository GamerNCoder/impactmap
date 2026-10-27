'use client'

import { useEffect, useSyncExternalStore } from 'react'

export const TEXT_SIZE_KEY = 'impactmap-text-size'
const STEPS = [100, 125, 150, 200]
const DEFAULT_SCALE = 100
const CHANGE_EVENT = 'impactmap-text-size-change'

function readScale(): number {
  try {
    const stored = Number(window.localStorage.getItem(TEXT_SIZE_KEY))
    return STEPS.includes(stored) ? stored : DEFAULT_SCALE
  } catch {
    return DEFAULT_SCALE
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function applyScale(scale: number) {
  const root = document.documentElement
  if (scale === DEFAULT_SCALE) root.style.removeProperty('font-size')
  else root.style.fontSize = `${scale}%`
}

function chooseScale(scale: number) {
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, String(scale))
  } catch {}
  applyScale(scale)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export default function TextSizeControl() {
  const scale = useSyncExternalStore(subscribe, readScale, () => DEFAULT_SCALE)
  const index = STEPS.indexOf(scale)

  // The inline script in the root layout restores a saved size before paint; this keeps the DOM in
  // sync when the stored value changes in another tab.
  useEffect(() => {
    applyScale(scale)
  }, [scale])

  return (
    <div className="inline-flex items-center gap-0.5" role="group" aria-label="Text size">
      <button
        type="button"
        onClick={() => chooseScale(STEPS[Math.max(0, index - 1)])}
        disabled={index <= 0}
        aria-label="Decrease text size A−"
        className="px-1.5 py-1 rounded-md text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        A−
      </button>
      <button
        type="button"
        onClick={() => chooseScale(STEPS[Math.min(STEPS.length - 1, index + 1)])}
        disabled={index >= STEPS.length - 1}
        aria-label="Increase text size A+"
        className="px-1.5 py-1 rounded-md text-xs font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        A+
      </button>
      <span className="sr-only" aria-live="polite">
        Text size {scale}%
      </span>
    </div>
  )
}
