import { createClient } from '@/lib/supabase/server'

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', userId)
    .maybeSingle()

  return Boolean(data?.is_platform_admin)
}
