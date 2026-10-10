import { createClient } from '@/lib/supabase/server'
import type { AuditAction } from '@/lib/security'

export async function logSecurityEvent(
  userId: string | null,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient()
  await supabase.from('security_audit_log').insert({
    user_id: userId,
    action,
    resource_type: resourceType ?? null,
    resource_id: resourceId ?? null,
    metadata: metadata ?? {},
  })
}

export async function getDailyTransferTotalCents(userId: string): Promise<number> {
  const supabase = await createClient()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('transfer_requests')
    .select('amount_cents')
    .eq('sender_id', userId)
    .in('status', ['pending', 'accepted'])
    .gte('created_at', startOfDay.toISOString())

  return (data ?? []).reduce((sum, row) => sum + row.amount_cents, 0)
}
