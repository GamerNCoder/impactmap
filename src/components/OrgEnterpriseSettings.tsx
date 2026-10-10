'use client'

import { useState } from 'react'
import type { PlanTier } from '@/lib/plan-tiers'

type OrgEnterpriseSettingsProps = {
  organizationId: string
  planTier: PlanTier
}

export default function OrgEnterpriseSettings({ organizationId }: OrgEnterpriseSettingsProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const createApiKey = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/org/${organizationId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Impact API key' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create key')
      setApiKey(data.key)
      setMessage('Copy this key now — it won’t be shown again.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  const saveWebhook = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/org/${organizationId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          events: ['hours.verified', 'application.completed'],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save webhook')
      setMessage(`Webhook registered. Secret: ${data.secret} (save for signature verification)`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-6">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Enterprise API &amp; webhooks</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Read impact data via API or receive webhooks when hours are verified or placements complete.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">API access</h3>
        <p className="text-xs text-gray-500 mb-2">
          GET /api/v1/org/{organizationId}/impact with header Authorization: Bearer &lt;key&gt;
        </p>
        <button
          type="button"
          onClick={createApiKey}
          disabled={loading}
          className="text-sm px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-50"
        >
          Generate API key
        </button>
        {apiKey && (
          <code className="block mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">{apiKey}</code>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Webhooks</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-system.com/webhooks/impactmap"
            className="flex-1 min-w-[200px] rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm dark:bg-gray-800"
          />
          <button
            type="button"
            onClick={saveWebhook}
            disabled={loading || !webhookUrl.trim()}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
          >
            Add webhook
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        SAML / SSO: configure via Supabase Auth SSO for your domain — contact enterprise@impactmap.app for setup assistance.
      </p>

      {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
    </section>
  )
}
