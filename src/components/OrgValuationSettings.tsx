'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HOUR_VALUATION_USD } from '@/lib/impact-passport'
import type { PlanTier } from '@/lib/plan-tiers'

type OrgValuationSettingsProps = {
  organizationId: string
  currentRate: number | null | undefined
  defaultRate: number
  planTier: PlanTier
}

export default function OrgValuationSettings({
  organizationId,
  currentRate,
  defaultRate,
}: OrgValuationSettingsProps) {
  const [rate, setRate] = useState(
    currentRate != null && currentRate > 0 ? String(currentRate) : String(defaultRate)
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const save = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const parsed = parseFloat(rate)
      if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
        throw new Error('Enter a rate between $1 and $500 per hour.')
      }
      const res = await fetch(`/api/org/${organizationId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_valuation_usd: parsed }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setMessage('Impact valuation updated — analytics and exports will use this rate.')
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Custom impact valuation</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Growth+ plans can set your own $/hr rate for grant reports and analytics (default Independent Sector: ${HOUR_VALUATION_USD}/hr).
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">USD per volunteer hour</label>
          <input
            type="number"
            min={1}
            max={500}
            step={0.01}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 w-36 dark:bg-gray-800"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save rate'}
        </button>
      </div>
      {message && <p className="text-sm mt-3 text-gray-600 dark:text-gray-400">{message}</p>}
    </section>
  )
}
