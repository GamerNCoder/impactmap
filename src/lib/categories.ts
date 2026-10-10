export const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  Education: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  Environment: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'Food Security': { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  Health: { bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' },
  Community: { bg: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-800 dark:text-violet-300', dot: 'bg-violet-500' },
  'Animal Welfare': { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-800 dark:text-orange-300', dot: 'bg-orange-500' },
  'Arts & Culture': { bg: 'bg-fuchsia-100 dark:bg-fuchsia-950', text: 'text-fuchsia-800 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' },
  'Disaster Relief': { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-500' },
}

export function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
  }
}
