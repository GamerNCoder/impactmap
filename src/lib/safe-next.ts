/** Only allow same-site relative paths; never protocol-relative or absolute URLs. */
export function safeNext(value: string | null | undefined, fallback = '/dashboard'): string {
  if (!value) return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
