/** Canonical URLs encoded into ImpactMap QR codes. */

export function verifyQrUrl(origin: string, code: string): string {
  return `${origin}/verify/${encodeURIComponent(code)}`
}

export function opportunityQrUrl(origin: string, opportunityId: string): string {
  return `${origin}/opportunities/${opportunityId}`
}

/**
 * The event's check-in QR. Scanning it actually records attendance at
 * /checkin/[id], rather than just opening the event page.
 */
export function checkInQrUrl(origin: string, opportunityId: string): string {
  return `${origin}/checkin/${opportunityId}`
}

export function volunteerPassportQrUrl(origin: string, volunteerId: string): string {
  return `${origin}/volunteers/${volunteerId}`
}
