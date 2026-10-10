'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TRANSFER_DAILY_LIMIT_CENTS, TRANSFER_MAX_CENTS, sanitizeText } from '@/lib/security'
import { trackClientEvent } from '@/lib/track-client'
import { APP_EVENTS } from '@/lib/app-events'

type TransferRequestFormProps = {
  recipientId: string
  recipientName: string
  senderIdVerified: boolean
}

export default function TransferRequestForm({
  recipientId,
  recipientName,
  senderIdVerified,
}: TransferRequestFormProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!senderIdVerified) {
      setError('ID verification is required before sending transfer requests.')
      return
    }

    const dollars = parseFloat(amount)
    if (Number.isNaN(dollars) || dollars <= 0) {
      setError('Enter a valid amount.')
      return
    }

    const amountCents = Math.round(dollars * 100)
    if (amountCents > TRANSFER_MAX_CENTS) {
      setError(`Maximum per transfer is $${(TRANSFER_MAX_CENTS / 100).toFixed(2)}.`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in required')
      if (user.id === recipientId) throw new Error('Cannot transfer to yourself')

      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const { data: today } = await supabase
        .from('transfer_requests')
        .select('amount_cents')
        .eq('sender_id', user.id)
        .in('status', ['pending', 'accepted'])
        .gte('created_at', startOfDay.toISOString())

      const dailyTotal = (today ?? []).reduce((s, r) => s + r.amount_cents, 0)
      if (dailyTotal + amountCents > TRANSFER_DAILY_LIMIT_CENTS) {
        throw new Error(`Daily limit of $${(TRANSFER_DAILY_LIMIT_CENTS / 100).toFixed(2)} exceeded.`)
      }

      const { error: insertError } = await supabase.from('transfer_requests').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        amount_cents: amountCents,
        note: sanitizeText(note, 500) || null,
        status: 'pending',
      })

      if (insertError) throw insertError

      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        action: 'transfer.create',
        resource_type: 'transfer_requests',
        metadata: { recipient_id: recipientId, amount_cents: amountCents },
      })

      trackClientEvent(APP_EVENTS.TRANSFER_CREATE, {
        resourceType: 'profile',
        resourceId: recipientId,
      })

      setSuccess(true)
      setAmount('')
      setNote('')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
        Transfer request sent to {recipientName}. They must accept before it is recorded as agreed.
        <p className="text-xs mt-2 text-emerald-700">
          ImpactMap does not move money — complete payment externally (Venmo, Zelle, etc.).
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded-xl p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
      <div className="text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 rounded-lg p-3">
        <strong>Security notice:</strong> Transfer requests are recorded agreements only. ImpactMap never holds or transmits funds.
        ID-verified users only · $500 max per request · $1,000 daily limit · All transfers are audit-logged.
      </div>

      {!senderIdVerified && (
        <p className="text-sm text-red-600">Verify your ID on your profile before sending transfer requests.</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Amount (USD) *</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={TRANSFER_MAX_CENTS / 100}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          disabled={!senderIdVerified}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Note</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Reimbursement for supplies"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          disabled={!senderIdVerified}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !senderIdVerified}
        className="w-full py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-50"
      >
        {loading ? 'Sending…' : `Request transfer to ${recipientName}`}
      </button>
    </form>
  )
}

type TransferActionsProps = {
  transferId: string
  status: string
  isRecipient: boolean
  isSender: boolean
}

export function TransferActions({ transferId, status, isRecipient, isSender }: TransferActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (status !== 'pending') return null

  const respond = async (newStatus: 'accepted' | 'declined' | 'cancelled') => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('transfer_requests')
        .update({ status: newStatus, responded_at: new Date().toISOString() })
        .eq('id', transferId)

      await supabase.from('security_audit_log').insert({
        user_id: user.id,
        action: newStatus === 'accepted' ? 'transfer.accept' : 'transfer.decline',
        resource_type: 'transfer_requests',
        resource_id: transferId,
      })

      if (newStatus === 'accepted' || newStatus === 'declined') {
        trackClientEvent(APP_EVENTS.TRANSFER_RESPOND, {
          resourceType: 'transfer_requests',
          resourceId: transferId,
          metadata: { status: newStatus },
        })
      }

      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      {isRecipient && (
        <>
          <button type="button" disabled={loading} onClick={() => respond('accepted')} className="text-sm px-3 py-1 rounded-lg bg-emerald-600 text-white">
            Accept
          </button>
          <button type="button" disabled={loading} onClick={() => respond('declined')} className="text-sm px-3 py-1 rounded-lg border text-red-600">
            Decline
          </button>
        </>
      )}
      {isSender && (
        <button type="button" disabled={loading} onClick={() => respond('cancelled')} className="text-sm px-3 py-1 rounded-lg border">
          Cancel
        </button>
      )}
    </div>
  )
}
