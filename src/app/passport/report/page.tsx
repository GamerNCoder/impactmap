import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import QRCode from 'qrcode'
import { formatDate } from '@/lib/constants'
import { getServiceRecord } from '@/lib/service-record'
import HoursGoal from '@/components/HoursGoal'
import PrintButton from '@/components/PrintButton'

export const metadata = {
  title: 'Service hours report | ImpactMap',
}

export default async function ServiceReportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/passport/report')

  const record = await getServiceRecord(supabase, user.id)
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'impactmap.vercel.app'
  const origin = `${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')}://${host}`

  const rows = await Promise.all(
    record.verified.map(async (r) => ({
      ...r,
      qr: await QRCode.toDataURL(`${origin}/verify/${r.code}`, { margin: 0, width: 160 }),
    }))
  )
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0 px-4 text-gray-900">
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <Link href="/passport" className="text-sm text-emerald-700 hover:underline">← My hours</Link>
        <PrintButton />
      </div>

      <article className="max-w-3xl mx-auto bg-white shadow-sm print:shadow-none rounded-xl print:rounded-none p-5 sm:p-8 print:p-0">
        <header className="flex items-start justify-between gap-4 border-b-2 border-emerald-600 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">ImpactMap · Verified service record</p>
            <h1 className="text-2xl font-bold mt-1">{record.name}</h1>
            <p className="text-sm text-gray-600">Generated {today}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-extrabold text-emerald-700">{record.verifiedHours.toFixed(1)}</p>
            <p className="text-sm text-gray-600">verified hours</p>
          </div>
        </header>

        {record.goal && (
          <div className="mt-4">
            <HoursGoal verifiedHours={record.verifiedHours} goal={record.goal} editable={false} light />
          </div>
        )}

        {rows.length > 0 ? (
          <table className="w-full mt-6 text-sm border-collapse">
            <thead>
              <tr className="text-left text-gray-600 border-b border-gray-300">
                <th className="py-2 pr-2 font-semibold w-24">Date</th>
                <th className="py-2 pr-2 font-semibold">Event & organizer</th>
                <th className="py-2 pr-2 font-semibold text-right">Hours</th>
                <th className="py-2 pr-2 font-semibold hidden sm:table-cell print:table-cell">Approved by</th>
                <th className="py-2 font-semibold text-right">Check it</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-b border-gray-200 align-top break-inside-avoid">
                  <td className="py-3 pr-2">{r.date ? formatDate(r.date) : '—'}</td>
                  <td className="py-3 pr-2">
                    <p className="font-medium">{r.event}</p>
                    <p className="text-gray-600">{r.organization}</p>
                    {r.approver && <p className="text-gray-500 text-xs mt-1 sm:hidden print:hidden">Approved by {r.approver}</p>}
                  </td>
                  <td className="py-3 pr-2 text-right font-semibold">{r.hours ?? '—'}</td>
                  <td className="py-3 pr-2 hidden sm:table-cell print:table-cell">{r.approver ?? '—'}</td>
                  <td className="py-3 text-right">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.qr} alt={`QR code to verify ${r.code}`} width={64} height={64} className="inline-block" />
                    <p className="font-mono text-[10px] mt-1 break-all">{r.code}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-8 text-gray-600">No verified hours yet.</p>
        )}

        <footer className="mt-6 text-xs text-gray-600 leading-relaxed">
          <p>
            <strong>For counselors:</strong> scan any QR code, or enter its code at{' '}
            <span className="font-mono">{origin.replace(/^https?:\/\//, '')}/verify</span>, to see who approved the hours and when.
            Codes are only issued when the event organizer approves the student&apos;s logged hours. Students cannot create or edit them.
          </p>
          {record.pending.length > 0 && (
            <p className="mt-2">Not included: {record.pending.length} entr{record.pending.length === 1 ? 'y' : 'ies'} still waiting for organizer approval.</p>
          )}
        </footer>
      </article>
    </div>
  )
}
