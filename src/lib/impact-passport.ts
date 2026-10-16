export function generateVerificationCode(): string {
  const segment = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
  return `IMP-${segment}`
}
