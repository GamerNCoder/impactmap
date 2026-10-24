/** Shared demo accounts. The passwords are server-only env vars; never expose them to the client. */

export const DEMO_ORG_ID = '33333333-3333-3333-3333-333333333301'
export const DEMO_EVENT_ID = '44444444-4444-4444-4444-444444444402'
export const DEMO_PENDING_HOURS_ID = '66666666-6666-6666-6666-666666666602'
export const DEMO_VERIFICATION_CODE = 'IMP-DEMO2026ABCD'

export const DEMO_STUDENT_EMAIL =
  process.env.DEMO_STUDENT_EMAIL ?? 'demo.student@impactmap.app'
export const DEMO_ORGANIZER_EMAIL =
  process.env.DEMO_ORGANIZER_EMAIL ?? 'demo.organizer@impactmap.app'

export const DEMO_STUDENT_PASSWORD = process.env.DEMO_STUDENT_PASSWORD ?? ''
export const DEMO_ORGANIZER_PASSWORD = process.env.DEMO_ORGANIZER_PASSWORD ?? ''

/** True when both demo accounts are configured on this deployment. */
export function demoEnabled(): boolean {
  return Boolean(DEMO_STUDENT_PASSWORD && DEMO_ORGANIZER_PASSWORD)
}

/** Server-side helper for the demo banner. */
export function isDemoEmail(email?: string | null): boolean {
  return email === DEMO_STUDENT_EMAIL || email === DEMO_ORGANIZER_EMAIL
}
