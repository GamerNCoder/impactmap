import Link from 'next/link'
import MatchBadge from '@/components/MatchBadge'
import MatchReasons from '@/components/MatchReasons'
import type { MatchResult } from '@/lib/matching'

type SkillMatchPanelProps = {
  match: MatchResult
}

export default function SkillMatchPanel({ match }: SkillMatchPanelProps) {
  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Your fit</h2>
        <MatchBadge score={match.score} size="sm" />
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Based on your profile skills and location — apply when the fit is strong to
        reduce wait times and help nonprofits review qualified volunteers first.
      </p>
      <MatchReasons
        reasons={match.reasons}
        matchedSkills={match.matchedSkills}
        missingSkills={match.missingSkills}
      />
      {match.score < 50 && (
        <Link
          href="/profile"
          className="inline-block mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-800"
        >
          Improve your match →
        </Link>
      )}
    </div>
  )
}
