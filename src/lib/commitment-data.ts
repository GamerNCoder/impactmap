import { createClient } from '@/lib/supabase/server'
import { computeCommitmentScore } from '@/lib/commitment-score'

export async function getUserCommitmentScore(userId: string) {
  const supabase = await createClient()

  const { data: applications } = await supabase
    .from('applications')
    .select('status, no_show, completed_at')
    .eq('user_id', userId)

  const { data: hours } = await supabase
    .from('volunteer_hours')
    .select('verified, hours')
    .eq('user_id', userId)

  return computeCommitmentScore(applications ?? [], hours ?? [])
}
