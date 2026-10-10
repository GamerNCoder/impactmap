import { planLabel, type PlanTier } from '@/lib/plan-tiers'

type OrgPlanBadgeProps = {
  planTier: PlanTier
  verified?: boolean
}

export default function OrgPlanBadge({ planTier, verified }: OrgPlanBadgeProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
        {planLabel(planTier)} plan
      </span>
      {verified && (
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
          ✓ Verified org
        </span>
      )}
    </div>
  )
}
