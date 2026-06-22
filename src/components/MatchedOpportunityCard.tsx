import Link from 'next/link'
import MatchBadge from '@/components/MatchBadge'
import MatchReasons from '@/components/MatchReasons'
import type { MatchResult } from '@/lib/matching'

type MatchedOpportunityCardProps = {
  id: string
  title: string
  category: string
  location: string | null
  remote: boolean
  organizationName?: string | null
  volunteersNeeded?: number | null
  volunteersCount?: number
  deadline?: string | null
  match: MatchResult
  rank?: number
}

export default function MatchedOpportunityCard({
  match,
  rank,
  ...opportunity
}: MatchedOpportunityCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {rank != null && (
            <span className="text-xs font-bold text-gray-400">#{rank}</span>
          )}
          <MatchBadge score={match.score} />
        </div>
      </div>

      <div className="px-6 flex-1 flex flex-col">
        <div className="text-sm text-indigo-600 font-medium mb-2">{opportunity.category}</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{opportunity.title}</h3>
        {opportunity.organizationName && (
          <p className="text-gray-600 mb-4">{opportunity.organizationName}</p>
        )}

        <div className="mb-4">
          <MatchReasons
            reasons={match.reasons.slice(0, 3)}
            matchedSkills={match.matchedSkills}
          />
        </div>
      </div>

      <div className="px-6 pb-6 mt-auto">
        <Link
          href={`/opportunities/${opportunity.id}`}
          className="inline-block text-indigo-600 font-medium hover:text-indigo-800"
        >
          View & apply →
        </Link>
      </div>
    </article>
  )
}
