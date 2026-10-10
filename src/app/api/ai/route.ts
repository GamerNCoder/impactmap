import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  type AiAction,
  AI_SYSTEM_PROMPTS,
  buildPersonalizedSystemPrompt,
  fallbackAttestationWhy,
  fallbackCopilot,
  fallbackEventDraft,
  fallbackImpactStory,
  fallbackMatchInsight,
  generateWithAi,
} from '@/lib/ai'
import { getAiUserContext } from '@/lib/ai-context'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'
import { sanitizeText } from '@/lib/security'

const rateMap = new Map<string, { count: number; reset: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRate(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || now > entry.reset) {
    rateMap.set(userId, { count: 1, reset: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRate(user.id)) {
    return NextResponse.json({ error: 'AI rate limit reached. Try again later.' }, { status: 429 })
  }

  let body: {
    action?: AiAction
    payload?: Record<string, unknown>
    history?: { role: 'user' | 'assistant'; content: string }[]
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = body.action
  const payload = body.payload ?? {}
  const history = body.history

  if (!action || !AI_SYSTEM_PROMPTS[action]) {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  const ctx = await getAiUserContext(user.id)
  const system = buildPersonalizedSystemPrompt(action, AI_SYSTEM_PROMPTS[action], ctx)

  let userPrompt = ''
  let fallback = ''

  switch (action) {
    case 'match-insight': {
      const p = {
        title: String(payload.title ?? ''),
        category: String(payload.category ?? ''),
        score: Number(payload.score ?? 0),
        matchedSkills: (payload.matchedSkills as string[]) ?? [],
        missingSkills: (payload.missingSkills as string[]) ?? [],
        location: payload.location as string | null,
      }
      userPrompt = JSON.stringify({
        event: p,
        volunteer: {
          verifiedSkills: ctx.verifiedSkills,
          unverifiedSkills: ctx.unverifiedSkills,
          pastCategories: ctx.pastCategories,
          commitmentLabel: ctx.commitmentLabel,
        },
      })
      fallback = fallbackMatchInsight(p, ctx)
      break
    }
    case 'attestation-why': {
      const p = {
        skills: (payload.skills as string[]) ?? ctx.skills,
        categories: (payload.categories as string[]) ?? ctx.preferredCategories,
        firstName: String(payload.firstName ?? ctx.firstName ?? ''),
      }
      userPrompt = JSON.stringify(p)
      fallback = fallbackAttestationWhy(p, ctx)
      break
    }
    case 'event-draft': {
      const p = {
        title: String(payload.title ?? ''),
        category: String(payload.category ?? ''),
        orgName: String(payload.orgName ?? ''),
        location: payload.location as string | null,
        remote: Boolean(payload.remote),
      }
      if (!p.title.trim()) {
        return NextResponse.json({ error: 'Event title required' }, { status: 400 })
      }
      userPrompt = JSON.stringify(p)
      fallback = fallbackEventDraft(p)
      break
    }
    case 'impact-story': {
      const p = {
        name: String(payload.name ?? ctx.fullName ?? ''),
        hours: Number(payload.hours ?? ctx.verifiedHours),
        skills:
          (payload.skills as string[]) ??
          (ctx.verifiedSkills.length ? ctx.verifiedSkills : ctx.skills),
        eventCount: Number(payload.eventCount ?? ctx.completedEvents),
      }
      userPrompt = JSON.stringify(p)
      fallback = fallbackImpactStory(p, ctx)
      break
    }
    case 'copilot': {
      const message = sanitizeText(String(payload.message ?? ''), 500)
      if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })
      const p = { message, page: String(payload.page ?? '') }
      userPrompt = message
      fallback = fallbackCopilot(p, ctx)
      break
    }
  }

  const sanitizedHistory = (history ?? [])
    .slice(-6)
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: sanitizeText(m.content, 800),
    }))
    .filter((m) => m.content.length > 0)

  const ai = await generateWithAi(action, system, userPrompt, {
    history: action === 'copilot' ? sanitizedHistory : undefined,
  })
  const text = ai.text || fallback

  void trackAppEvent({
    event: APP_EVENTS.AI_REQUEST,
    userId: user.id,
    metadata: { action },
  })

  return NextResponse.json({
    text,
    source: ai.text ? ai.source : 'impactmap',
  })
}
