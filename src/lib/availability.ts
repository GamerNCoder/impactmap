// Volunteer availability: day-of-week plus a coarse part of day.
// Deliberately no clock times — a "morning / afternoon / evening" band avoids timezone and
// DST mistakes, and it is only ever shown to the student themselves (owner-only, via my_profile()).

export const AVAILABILITY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
export const AVAILABILITY_SLOTS = ['morning', 'afternoon', 'evening'] as const

export type AvailabilityDay = (typeof AVAILABILITY_DAYS)[number]
export type AvailabilitySlot = (typeof AVAILABILITY_SLOTS)[number]

export function availabilityKey(day: string, slot: string): string {
  return `${day}-${slot}`
}

export function toggleAvailability(values: string[], key: string): string[] {
  return values.includes(key) ? values.filter((v) => v !== key) : [...values, key]
}

/** Human summary, e.g. "Mon morning & afternoon · Sat morning". */
export function formatAvailability(values: string[]): string {
  const byDay = new Map<string, string[]>()
  for (const value of values) {
    const [day, slot] = value.split('-')
    if (!day || !slot) continue
    const slots = byDay.get(day) ?? []
    slots.push(slot)
    byDay.set(day, slots)
  }
  return AVAILABILITY_DAYS.filter((day) => byDay.has(day))
    .map((day) => `${day} ${(byDay.get(day) ?? []).join(' & ')}`)
    .join(' · ')
}
