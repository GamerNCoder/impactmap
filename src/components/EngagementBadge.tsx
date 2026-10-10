type EngagementBadgeProps = {
  status: 'active' | 'at_risk' | 'churned' | 'new'
}

const STYLES = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  at_risk: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  churned: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  new: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
}

const LABELS = {
  active: 'Active',
  at_risk: 'At risk',
  churned: 'Churned',
  new: 'New',
}

export default function EngagementBadge({ status }: EngagementBadgeProps) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
