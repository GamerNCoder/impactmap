'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import CompetencyTestRunner from '@/components/CompetencyTestRunner'
import type { CompetencyResult } from '@/lib/competency-data'

type SkillVerifyClientProps = {
  profileSkills: string[]
  results: CompetencyResult[]
  initialSkill: string | null
}

export default function SkillVerifyClient({
  profileSkills,
  results,
  initialSkill,
}: SkillVerifyClientProps) {
  const router = useRouter()
  const [activeSkill, setActiveSkill] = useState<string | null>(initialSkill)
  const resultBySkill = new Map(results.map((r) => [r.skill_key, r]))

  if (activeSkill) {
    return (
      <CompetencyTestRunner
        skill={activeSkill}
        onCancel={() => setActiveSkill(null)}
        onComplete={() => {
          setActiveSkill(null)
          router.refresh()
        }}
      />
    )
  }

  const unverified = profileSkills.filter((s) => !resultBySkill.get(s)?.passed)
  const verified = profileSkills.filter((s) => resultBySkill.get(s)?.passed)

  return (
    <div className="space-y-6">
      {verified.length > 0 && (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Verified skills</h2>
          <ul className="space-y-2">
            {verified.map((skill) => {
              const r = resultBySkill.get(skill)!
              return (
                <li
                  key={skill}
                  className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <span className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <span className="text-emerald-600" aria-hidden>✓</span>
                    {skill}
                  </span>
                  <span className="text-sm text-gray-500">Best {r.best_score}%</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {unverified.length > 0 ? (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Take a test</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose a skill from your profile to start a randomized quiz.
          </p>
          <div className="grid gap-2">
            {unverified.map((skill) => {
              const r = resultBySkill.get(skill)
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => setActiveSkill(skill)}
                  className="flex items-center justify-between gap-3 w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{skill}</span>
                  <span className="text-sm text-emerald-600 font-medium">
                    {r ? `Retry (${r.best_score}% best)` : 'Start test →'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-6 text-center">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            All profile skills verified!
          </p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
            Coordinators and hosts can see your verified skills on your public passport.
          </p>
        </div>
      )}
    </div>
  )
}
