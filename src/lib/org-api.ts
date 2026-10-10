import { createHash, randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const raw = randomBytes(32).toString('base64url')
  const key = `im_live_${raw}`
  const prefix = key.slice(0, 12)
  return { key, prefix, hash: hashApiKey(key) }
}

export function generateWebhookSecret(): string {
  return randomBytes(24).toString('base64url')
}

export async function dispatchOrgWebhooks(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: hooks } = await supabase
    .from('org_webhooks')
    .select('url, secret, events')
    .eq('organization_id', organizationId)
    .eq('active', true)

  const targets = (hooks ?? []).filter((h) => h.events?.includes(event))
  await Promise.allSettled(
    targets.map((hook) =>
      fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ImpactMap-Event': event,
          'X-ImpactMap-Signature': createHash('sha256')
            .update(`${hook.secret}:${JSON.stringify(payload)}`)
            .digest('hex'),
        },
        body: JSON.stringify({ event, organization_id: organizationId, data: payload }),
      })
    )
  )
}

export async function authenticateOrgApiKey(
  organizationId: string,
  bearerToken: string | null
): Promise<boolean> {
  if (!bearerToken?.startsWith('im_live_')) return false
  const supabase = await createClient()
  const hash = hashApiKey(bearerToken)
  const { data } = await supabase
    .from('org_api_keys')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('key_hash', hash)
    .maybeSingle()

  if (data?.id) {
    await supabase
      .from('org_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id)
    return true
  }
  return false
}
