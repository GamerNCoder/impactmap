/** Canonical URLs / payloads encoded into ImpactMap QR codes. */

export function verifyQrUrl(origin: string, code: string): string {
  return `${origin}/verify/${encodeURIComponent(code)}`
}

export function opportunityQrUrl(origin: string, opportunityId: string): string {
  return `${origin}/opportunities/${opportunityId}`
}

export function volunteerPassportQrUrl(origin: string, volunteerId: string): string {
  return `${origin}/volunteers/${volunteerId}`
}

export function volunteerCheckInPayload(
  volunteerId: string,
  organizationId: string
): string {
  return JSON.stringify({
    v: 1,
    type: 'impactmap',
    action: 'volunteer',
    volunteerId,
    organizationId,
  })
}

export function eventCheckInPayload(opportunityId: string): string {
  return JSON.stringify({
    v: 1,
    type: 'impactmap',
    action: 'checkin',
    opportunityId,
  })
}
