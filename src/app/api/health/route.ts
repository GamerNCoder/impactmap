import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('opportunities')
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    if (error) throw error

    return Response.json({
      ok: true,
      service: 'impactmap',
      database: 'ok',
      latency_ms: Date.now() - started,
    })
  } catch {
    return Response.json(
      { ok: false, service: 'impactmap', database: 'unreachable' },
      { status: 503 }
    )
  }
}
