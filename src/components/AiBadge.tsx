export default function AiBadge({ source }: { source?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
      <span aria-hidden className="text-sm">✨</span>
      {source === 'openai' ? 'AI' : 'ImpactMap AI'}
    </span>
  )
}
