import Link from 'next/link'
import type { CompetencyResult } from '@/lib/competency-data'
import { PASS_THRESHOLD_PERCENT } from '@/lib/competency-tests'

type SkillVerificationPanelProps = {
  profileSkills: string[]
  results: CompetencyResult[]
  compact?: boolean
}

export default function SkillVerificationPanel({
  profileSkills,
  results,
  compact = false,
}: SkillVerificationPanelProps) {
  const resultBySkill = new Map(results.map((r) => [r.skill_key, r]))
  const verified = profileSkills.filter((s) => resultBySkill.get(s)?.passed)
  const unverified = profileSkills.filter((s) => !resultBySkill.get(s)?.passed)

  if (!profileSkills.length) {
    return (
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Add skills to your profile first, then verify them with a short competency test.
      </p>
    )
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-base' : 'text-lg'}`}>
            Skill verification
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Prove your skills with a {PASS_THRESHOLD_PERCENT}%+ quiz. Verified skills show a checkmark on your passport.
          </p>
        </div>
        {unverified.length > 0 && (
          <Link
            href="/skills/verify"
            className="shrink-0 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            Verify skills
          </Link>
        )}
      </div>

      {verified.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-2">
            Verified ({verified.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {verified.map((skill) => {
              const r = resultBySkill.get(skill)!
              return (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 text-sm bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800"
                  title={`Best score: ${r.best_score}%`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  {skill}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {unverified.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Not yet verified ({unverified.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unverified.map((skill) => {
              const r = resultBySkill.get(skill)
              return (
                <Link
                  key={skill}
                  href={`/skills/verify?skill=${encodeURIComponent(skill)}`}
                  className="inline-flex items-center gap-1.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 hover:border-emerald-400 transition-colors"
                  title={r ? `Best attempt: ${r.best_score}%` : 'Take competency test'}
                >
                  {skill}
                  <span className="text-emerald-600 text-xs font-medium">Test →</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {verified.length === profileSkills.length && (
        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
          All your listed skills are competency-verified.
        </p>
      )}
    </div>
  )
}
