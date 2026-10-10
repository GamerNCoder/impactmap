/** Strip HTML and limit length for user-generated content. */
export function sanitizeText(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input?.trim()) return null
  try {
    const url = new URL(input.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export const TRANSFER_MAX_CENTS = 50000 // $500.00
export const TRANSFER_DAILY_LIMIT_CENTS = 100000 // $1000/day
export const MESSAGE_MAX_LENGTH = 4000
export const POST_MAX_LENGTH = 8000

export type AuditAction =
  | 'transfer.create'
  | 'transfer.accept'
  | 'transfer.decline'
  | 'message.send'
  | 'group.create'
  | 'forum.post'
  | 'share.post'
  | 'login.attempt'
  | 'hours.verify'
  | 'completion.verify'
  | 'org.export'
  | 'org.coordinator.approve'
  | 'org.coordinator.reject'
  | 'application.accept'
  | 'application.reject'
  | 'org.verify'
  | 'org.settings.valuation'

export async function hashForAudit(value: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(value)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16)
  }
  return 'unavailable'
}
