import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

function icsDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from('opportunities')
    .select('title, description, location, start_date, end_date, remote')
    .eq('id', id)
    .single()

  if (!event || !event.start_date) {
    return new NextResponse('Event not found', { status: 404 })
  }

  const start = new Date(event.start_date)
  const end = event.end_date ? new Date(event.end_date) : new Date(start.getTime() + 2 * 3600e3)
  const location = event.remote ? 'Online' : event.location ?? ''
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ImpactMap//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${id}@impactmap.vercel.app`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description ?? '')}`,
    `LOCATION:${escapeIcs(location)}`,
    `URL:https://impactmap.vercel.app/opportunities/${id}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="impactmap-${id}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
