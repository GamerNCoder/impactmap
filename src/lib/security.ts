/** Strip HTML and limit length for user-generated content. */
export function sanitizeText(input: string, maxLength = 5000): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength)
}

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
