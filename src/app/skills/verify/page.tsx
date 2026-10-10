import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SkillVerifyClient from '@/components/SkillVerifyClient'
import { getUserCompetencyResults } from '@/lib/competency-data'
import { filterValidSkills } from '@/lib/skills'
import { isValidSkillKey } from '@/lib/competency-tests'

export const metadata = {
  title: 'Verify Skills | ImpactMap',
  description: 'Take short competency tests to prove the skills on your profile.',
}

type PageProps = {
  searchParams: Promise<{ skill?: string }>
}

export default async function SkillVerifyPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?next=/skills/verify')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('skills')
    .eq('id', user.id)
    .maybeSingle()

  const skills = filterValidSkills(profile?.skills)
  if (!skills.length) {
    redirect('/profile')
  }

  const results = await getUserCompetencyResults(user.id)
  const params = await searchParams
  const initialSkill =
    params.skill && isValidSkillKey(params.skill) && skills.includes(params.skill)
      ? params.skill
      : null

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wide">
            Skill competency
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            Prove your skills
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Each test has 5 scenario-based questions. Score 80% or higher to earn a verified badge on that skill.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <SkillVerifyClient
          profileSkills={skills}
          results={results}
          initialSkill={initialSkill}
        />
      </div>
    </div>
  )
}
