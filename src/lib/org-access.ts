import { createClient } from '@/lib/supabase/server'

export const ORG_MANAGE_ROLES = ['owner', 'coordinator'] as const
export type OrgRole = 'owner' | 'coordinator' | 'viewer' | string

export async function getOrgMembership(organizationId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function canManageOrg(organizationId: string, userId: string): Promise<boolean> {
  const membership = await getOrgMembership(organizationId, userId)
  return membership ? ORG_MANAGE_ROLES.includes(membership.role as (typeof ORG_MANAGE_ROLES)[number]) : false
}

export async function isOrgOwner(organizationId: string, userId: string): Promise<boolean> {
  const membership = await getOrgMembership(organizationId, userId)
  return membership?.role === 'owner'
}
