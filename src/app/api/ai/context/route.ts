import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { copilotGreeting, copilotSuggestions, getAiUserContext } from '@/lib/ai-context'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ctx = await getAiUserContext(user.id)

  return NextResponse.json({
    greeting: copilotGreeting(ctx),
    suggestions: copilotSuggestions(ctx),
    firstName: ctx.firstName,
  })
}
