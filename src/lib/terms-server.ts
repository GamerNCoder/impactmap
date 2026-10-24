import { createClient } from '@/lib/supabase/server'
import { CURRENT_TERMS_VERSION } from '@/lib/terms'

export async function recordTermsAcceptance(userId: string): Promise<void> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({
      terms_accepted_at: now,
      terms_version: CURRENT_TERMS_VERSION,
    })
    .eq('id', userId)

  if (error) throw error
}
