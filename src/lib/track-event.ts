import { createClient } from '@/lib/supabase/server'
import { categoryForEvent, type TrackEventInput } from '@/lib/app-events'
import { sanitizeText } from '@/lib/security'

/** Server-side silent event capture. Never throws — analytics must not break UX. */
export async function trackAppEvent(input: TrackEventInput): Promise<void> {
  try {
    const supabase = await createClient()
    const metadata = input.metadata ?? {}
    const safeMeta: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') safeMeta[key] = sanitizeText(value, 500)
      else if (typeof value === 'number' || typeof value === 'boolean') safeMeta[key] = value
    }

    await supabase.from('app_events').insert({
      user_id: input.userId ?? null,
      organization_id: input.organizationId ?? null,
      event_name: input.event,
      category: categoryForEvent(input.event),
      path: input.path ? sanitizeText(input.path, 300) : null,
      resource_type: input.resourceType ? sanitizeText(input.resourceType, 80) : null,
      resource_id: input.resourceId ?? null,
      metadata: safeMeta,
    })
  } catch {
    // Silent failure by design
  }
}
