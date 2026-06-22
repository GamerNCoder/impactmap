import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

type SearchParams = Promise<{ code?: string; next?: string }>

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code)
    if (error) {
      redirect('/auth/login?error=Authentication failed')
    }
  }

  redirect(params.next || '/dashboard')
}
