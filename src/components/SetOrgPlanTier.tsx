'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLAN_TIERS, planLabel, type PlanTier } from '@/lib/plan-tiers'

type SetOrgPlanTierProps = {
  organizationId: string
  currentTier: string | null
}

export default function SetOrgPlanTier({ organizationId, currentTier }: SetOrgPlanTierProps) {
  const [tier, setTier] = useState<PlanTier>(
    (currentTier === 'growth' || currentTier === 'enterprise' ? currentTier : 'starter')
  )
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const save = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_tier: tier }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value as PlanTier)}
        className="text-sm border rounded-lg px-2 py-1 dark:bg-gray-800"
      >
        {PLAN_TIERS.map((t) => (
          <option key={t} value={t}>{planLabel(t)}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={save}
        disabled={loading}
        className="text-xs px-2 py-1 rounded bg-gray-800 text-white disabled:opacity-50"
      >
        Set plan
      </button>
    </div>
  )
}
