import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TransferActions } from '@/components/TransferRequestForm'
import { formatDate } from '@/lib/constants'

export const metadata = {
  title: 'Transfers | ImpactMap',
  description: 'View and manage P2P transfer requests.',
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default async function TransfersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/transfers')

  const { data: transfers } = await supabase
    .from('transfer_requests')
    .select('*, sender:profiles!transfer_requests_sender_id_fkey(full_name), recipient:profiles!transfer_requests_recipient_id_fkey(full_name)')
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/community" className="text-sm text-emerald-600 hover:underline">← Community</Link>
        <h1 className="text-2xl font-bold mt-2">Transfer requests</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Recorded agreements only — complete payment externally. ID verification required to send.
        </p>

        <ul className="mt-8 space-y-4">
          {(transfers ?? []).length === 0 ? (
            <li className="text-sm text-gray-500">No transfer requests yet. Start a conversation to send one.</li>
          ) : (
            (transfers ?? []).map((t) => {
              const isSender = t.sender_id === user.id
              const counterparty = isSender ? t.recipient : t.sender
              return (
                <li key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{formatCents(t.amount_cents)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {isSender ? 'To' : 'From'} {counterparty?.full_name ?? 'Volunteer'}
                      </p>
                      {t.note && <p className="text-sm mt-1">{t.note}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      t.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{t.created_at ? formatDate(t.created_at) : ''}</p>
                  <TransferActions
                    transferId={t.id}
                    status={t.status}
                    isRecipient={t.recipient_id === user.id}
                    isSender={isSender}
                  />
                </li>
              )
            })
          )}
        </ul>
      </div>
    </div>
  )
}
