'use client'

import { type ReactNode } from 'react'

const DELAYS = [
  '',
  'motion-delay-1',
  'motion-delay-2',
  'motion-delay-3',
  'motion-delay-4',
  'motion-delay-5',
  'motion-delay-6',
] as const

type FadeInProps = {
  children: ReactNode
  className?: string
  /** Stagger index 0–6 */
  delay?: number
  variant?: 'up' | 'fade' | 'scale'
}

export function FadeIn({
  children,
  className = '',
  delay = 0,
  variant = 'up',
}: FadeInProps) {
  const anim =
    variant === 'fade'
      ? 'motion-fade-in'
      : variant === 'scale'
        ? 'motion-fade-in-scale'
        : 'motion-fade-in-up'
  const delayClass = DELAYS[Math.min(delay, DELAYS.length - 1)] ?? ''

  return <div className={`${anim} ${delayClass} ${className}`.trim()}>{children}</div>
}

type StepEnterProps = {
  children: ReactNode
  step: number | string
  className?: string
}

/** Re-mounts children with enter animation when step changes. */
export function StepEnter({ children, step, className = '' }: StepEnterProps) {
  return (
    <div key={step} className={`motion-step-enter ${className}`.trim()}>
      {children}
    </div>
  )
}

type StaggerProps = {
  children: ReactNode[]
  className?: string
  itemClassName?: string
}

export function Stagger({ children, className = '', itemClassName = '' }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <div key={i} className={`motion-fade-in-up ${DELAYS[Math.min(i + 1, DELAYS.length - 1)]} ${itemClassName}`.trim()}>
          {child}
        </div>
      ))}
    </div>
  )
}
