import { createClient } from '@/lib/supabase/server'

export type CompetencyResult = {
  skill_key: string
  score_percent: number
  passed: boolean
  passed_at: string | null
  best_score: number
  attempt_count: number
}

export async function getUserCompetencyResults(userId: string): Promise<CompetencyResult[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('skill_competency_results')
    .select('skill_key, score_percent, passed, passed_at, best_score, attempt_count')
    .eq('user_id', userId)

  return (data ?? []) as CompetencyResult[]
}

export async function getPassedSkills(userId: string): Promise<string[]> {
  const results = await getUserCompetencyResults(userId)
  return results.filter((r) => r.passed).map((r) => r.skill_key)
}

export async function getPublicPassedSkills(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('skill_competency_results')
    .select('skill_key')
    .eq('user_id', userId)
    .eq('passed', true)

  return (data ?? []).map((r) => r.skill_key)
}
