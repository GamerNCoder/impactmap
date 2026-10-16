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
