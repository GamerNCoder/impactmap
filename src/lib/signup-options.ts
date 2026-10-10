export const VOLUNTEER_AVAILABILITY = [
  'Weekdays',
  'Weekends',
  'Evenings',
  'Flexible',
  'School breaks',
] as const

export const REFERRAL_SOURCES = [
  'Friend or family',
  'School or university',
  'Social media',
  'Search engine',
  'Organization',
  'Event or fair',
  'Other',
] as const

export type VolunteerAvailability = (typeof VOLUNTEER_AVAILABILITY)[number]
export type ReferralSource = (typeof REFERRAL_SOURCES)[number]
