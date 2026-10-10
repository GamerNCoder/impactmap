import { sanitizeText } from '@/lib/security'
import type { AiUserContext } from '@/lib/ai-context'
import { formatAiUserContext } from '@/lib/ai-context'

export type AiAction =
  | 'match-insight'
  | 'attestation-why'
  | 'event-draft'
  | 'impact-story'
  | 'copilot'

export type AiResult = {
  text: string
  source: 'openai' | 'impactmap'
}

/** Fast model for short, structured outputs. */
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
/** Richer model for multi-turn Copilot — override with OPENAI_COPILOT_MODEL. */
const COPILOT_MODEL =
  process.env.OPENAI_COPILOT_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o'

function modelForAction(action: AiAction): string {
  return action === 'copilot' ? COPILOT_MODEL : DEFAULT_MODEL
}

export async function generateWithAi(
  action: AiAction,
  system: string,
  user: string,
  options?: { history?: { role: 'user' | 'assistant'; content: string }[] }
): Promise<AiResult> {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return { text: '', source: 'impactmap' }
  }

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: system },
  ]
  if (options?.history?.length) {
    for (const msg of options.history.slice(-6)) {
      messages.push({ role: msg.role, content: msg.content })
    }
  }
  messages.push({ role: 'user', content: user })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelForAction(action),
        temperature: action === 'copilot' ? 0.65 : 0.7,
        max_tokens: action === 'copilot' ? 500 : 400,
        messages,
      }),
    })

    if (!res.ok) return { text: '', source: 'impactmap' }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const text = data.choices?.[0]?.message?.content?.trim() ?? ''
    return text ? { text: sanitizeText(text, 2000), source: 'openai' } : { text: '', source: 'impactmap' }
  } catch {
    return { text: '', source: 'impactmap' }
  }
}

export function buildPersonalizedSystemPrompt(
  action: AiAction,
  base: string,
  ctx: AiUserContext | null
): string {
  if (!ctx) return base
  const profileBlock = formatAiUserContext(ctx)
  const personalize = `You are speaking directly to this volunteer. Use their first name when natural. Reference their real skills, location, hours, and goals — never invent facts. Keep tone warm and specific.\n\nVolunteer profile:\n${profileBlock}`
  return `${base}\n\n${personalize}`
}

export function fallbackMatchInsight(
  payload: {
    title: string
    category: string
    score: number
    matchedSkills: string[]
    location?: string | null
    missingSkills?: string[]
  },
  ctx?: AiUserContext | null
): string {
  const name = ctx?.firstName ?? 'You'
  const skills = payload.matchedSkills.slice(0, 3).join(', ') || 'your profile'
  const verified = payload.matchedSkills.filter((s) => ctx?.verifiedSkills.includes(s))
  const verifiedNote =
    verified.length > 0
      ? ` Your competency-verified ${verified.join(' and ')} stand out to hosts.`
      : ctx?.unverifiedSkills.some((s) => payload.matchedSkills.includes(s))
        ? ` Consider verifying ${payload.matchedSkills.find((s) => ctx.unverifiedSkills.includes(s))} to strengthen your application.`
        : ''
  const vibe =
    payload.score >= 80
      ? `${name}, this is a standout match`
      : payload.score >= 60
        ? `Solid fit for you, ${name}`
        : `Worth exploring, ${name}`
  const travel =
    payload.location && ctx?.location
      ? payload.location.toLowerCase().includes(ctx.location.toLowerCase().split(',')[0])
        ? ` It's in your area (${ctx.location}).`
        : ` It's listed near ${payload.location}.`
      : payload.location
        ? ` It's near ${payload.location}.`
        : ''
  return `${vibe} — your ${skills} skills map to "${payload.title}" in ${payload.category}.${travel}${verifiedNote} Mention your relevant experience when you apply.`
}

export function fallbackAttestationWhy(
  payload: {
    skills?: string[]
    categories?: string[]
    firstName?: string
  },
  ctx?: AiUserContext | null
): string {
  const name = payload.firstName?.trim() || ctx?.firstName || 'my community'
  const skill = payload.skills?.[0] ?? ctx?.verifiedSkills[0] ?? ctx?.skills[0] ?? 'my time and skills'
  const cause = payload.categories?.[0] ?? ctx?.preferredCategories[0] ?? ctx?.pastCategories[0] ?? 'local causes'
  const hours =
    ctx && ctx.verifiedHours > 0
      ? ` I've already logged ${ctx.verifiedHours.toFixed(0)} verified hours and want that record to keep growing.`
      : ''
  return ` I want to volunteer with ImpactMap to support ${cause}, use ${skill} in a meaningful way, and build a verified record of service I can share with ${name === 'my community' ? 'employers and schools' : 'partners who count on me'}.${hours}`
}

export function fallbackEventDraft(payload: {
  title: string
  category: string
  orgName?: string
  location?: string | null
  remote?: boolean
}): string {
  const where = payload.remote ? 'online' : payload.location ? `in ${payload.location}` : 'in the community'
  const org = payload.orgName ? `${payload.orgName} is hosting` : 'We are hosting'
  return `${org} "${payload.title}" — a ${payload.category.toLowerCase()} opportunity ${where}.

Volunteers will help with hands-on tasks, collaborate with coordinators, and leave with verified hours for their Impact Passport.

What to bring: comfortable clothes, a positive attitude, and anything listed in the event details. No experience required — just reliability and willingness to learn.`
}

export function fallbackImpactStory(
  payload: {
    name?: string
    hours: number
    skills?: string[]
    eventCount?: number
  },
  ctx?: AiUserContext | null
): string {
  const who = payload.name?.split(' ')[0] ?? ctx?.firstName ?? 'They'
  const skills =
    payload.skills?.slice(0, 2).join(' and ') ??
    ctx?.verifiedSkills.slice(0, 2).join(' and ') ??
    ctx?.skills.slice(0, 2).join(' and ') ??
    'community service'
  const verified =
    ctx?.verifiedSkills.length
      ? ` Competency-verified in ${ctx.verifiedSkills.slice(0, 2).join(' and ')}.`
      : ''
  return `${who} has logged ${payload.hours.toFixed(1)} verified volunteer hours on ImpactMap${
    payload.eventCount ? ` across ${payload.eventCount} events` : ''
  }, bringing ${skills} to causes that matter.${verified} Every hour is coordinator-attested and shareable with a public IMP- verification link — proof that counts for schools, employers, and funders.`
}

export function fallbackCopilot(
  payload: { message: string; page?: string },
  ctx?: AiUserContext | null
): string {
  const name = ctx?.firstName ? `${ctx.firstName}, ` : ''
  const q = payload.message.toLowerCase()

  if (q.includes('verify') && q.includes('skill')) {
    const skill = ctx?.unverifiedSkills[0]
    return skill
      ? `${name}head to Hub → More → Verify skills and take the ${skill} quiz (5 questions, 80% to pass). Verified skills boost your match score and show a checkmark on your public passport.`
      : `${name}open Verify skills from the More menu — each quiz takes a few minutes and proves the skills on your profile to hosts.`
  }
  if (q.includes('match') || q.includes('event') || q.includes('join')) {
    const skillHint = ctx?.skills.length
      ? ` Your ${ctx.skills.slice(0, 2).join(' and ')} skills are already in play.`
      : ''
    return `${name}open Discover from the Hub — we rank events against your profile.${skillHint} Aim for 60%+ matches first; your ${ctx?.commitmentLabel.toLowerCase() ?? 'building'} commitment score helps hosts trust you.`
  }
  if (q.includes('verif') || q.includes('id') || q.includes('passport')) {
    if (ctx?.idVerified) {
      return `${name}your ID is verified and your passport is live at /volunteers/your-id. Share it after events — coordinators can leave reviews that boost your Commitment Score.`
    }
    return `${name}complete ID verification on your profile (ID photo + selfie + written statement). Coordinators verify hours after events; each approval issues an IMP- code anyone can audit.`
  }
  if (q.includes('hour') || q.includes('log')) {
    return ctx?.verifiedHours
      ? `${name}you've logged ${ctx.verifiedHours.toFixed(1)} verified hours so far. Log new hours from your Hub after each event — coordinators attest them for your Passport.`
      : `${name}after an event, log hours from your Hub. Your coordinator attests them — that unlocks Impact Passport credentials and boosts your Commitment Score.`
  }
  if (q.includes('host') || q.includes('org')) {
    return `${name}tap Host to post an event under your organization. Coordinators get a dashboard to verify volunteers and export grant-ready CSV reports.`
  }
  return `${name}I'm Impact Copilot — I know your profile${
    ctx?.skills.length ? ` (${ctx.skills.slice(0, 3).join(', ')})` : ''
  }${payload.page ? ` and that you're on ${payload.page}` : ''}. Ask about SkillMatch, verifying skills or hours, your Passport, or hosting. What would you like to do next?`
}

export const AI_SYSTEM_PROMPTS: Record<AiAction, string> = {
  'match-insight':
    'You are ImpactMap SkillMatch AI. Write 2-3 warm, specific sentences explaining why this volunteer is a great fit for the event in the user message. Reference their verified skills, location, and past categories when relevant. Be encouraging, concrete, no bullet points. Under 320 characters.',
  'attestation-why':
    'You are ImpactMap identity assistant. Continue the sentence after "because" with 1-2 sincere sentences about why they volunteer. First person. No quotes. Start with a space then text. Tie to their stated skills and preferred causes. Under 220 characters.',
  'event-draft':
    'You are ImpactMap host assistant. Write a welcoming volunteer event description: what volunteers do, who it helps, what to bring. 3 short paragraphs, plain text, under 500 characters total.',
  'impact-story':
    'You are ImpactMap storyteller. Write a third-person impact blurb for sharing on LinkedIn or a grant app. Celebratory but factual. 2-3 sentences. Mention verified hours and competency-verified skills if provided.',
  copilot:
    'You are Impact Copilot on ImpactMap — a personal guide who knows this volunteer\'s profile, skills, hours, and goals. Use their first name. Give specific next steps (which page, which skill to verify, which match to try). Under 130 words. Warm, never generic.',
}

