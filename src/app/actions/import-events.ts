'use server'

import { createClient } from '@/lib/supabase/server'
import { canManageOrg } from '@/lib/org-access'
import { revalidatePath } from 'next/cache'
import { OPPORTUNITY_CATEGORIES } from '@/lib/constants'

export type ImportEventRow = {
  title: string
  category: string
  start_date: string
  location: string
  volunteers_needed: number
  wheelchair_accessible: boolean
  substance_free: boolean
}

export async function importEvents(orgId: string, rows: ImportEventRow[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sign in again.' }
  if (!(await canManageOrg(orgId, user.id))) return { error: 'You cannot import events for this organization.' }
  if (rows.length === 0) return { error: 'No rows to import.' }
  if (rows.length > 200) return { error: 'Import at most 200 events at a time.' }

  for (const [index, row] of rows.entries()) {
    if (!row.title.trim()) return { error: `Row ${index + 1}: title is required.` }
    if (!OPPORTUNITY_CATEGORIES.includes(row.category as never)) {
      return { error: `Row ${index + 1}: category must be one of ${OPPORTUNITY_CATEGORIES.join(', ')}.` }
    }
    if (!row.start_date || Number.isNaN(new Date(row.start_date).getTime())) {
      return { error: `Row ${index + 1}: start_date must be an ISO date.` }
    }
    if (!Number.isFinite(row.volunteers_needed) || row.volunteers_needed < 1) {
      return { error: `Row ${index + 1}: volunteers_needed must be at least 1.` }
    }
  }

  const payload = rows.map((row) => ({
    organization_id: orgId,
    posted_by: user.id,
    title: row.title.trim(),
    description: '',
    category: row.category,
    start_date: new Date(row.start_date).toISOString(),
    location: row.location.trim() || null,
    volunteers_needed: row.volunteers_needed,
    status: 'open',
    wheelchair_accessible: row.wheelchair_accessible,
    substance_free: row.substance_free,
  }))

  const { error } = await supabase.from('opportunities').insert(payload)
  if (error) return { error: error.message }

  revalidatePath('/opportunities')
  revalidatePath(`/organizations/${orgId}/manage`)
  return { ok: true, count: payload.length }
}
