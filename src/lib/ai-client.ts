'use client'

import type { AiAction } from '@/lib/ai'

export type AiMessage = { role: 'user' | 'assistant'; content: string }

export async function requestAi(
  action: AiAction,
  payload: Record<string, unknown>,
  options?: { history?: AiMessage[] }
): Promise<{ text: string; source: string }> {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, history: options?.history }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'AI request failed')
  return data
}

export async function fetchAiContext(): Promise<{
  greeting: string
  suggestions: string[]
  firstName: string | null
}> {
  const res = await fetch('/api/ai/context')
  if (!res.ok) {
    return {
      greeting: "Hey! I'm Impact Copilot ✨ Ask me about SkillMatch, verifying hours, your Passport, or hosting events.",
      suggestions: [
        'What event should I join?',
        'How do I verify my hours?',
        'Help with my Impact Passport',
      ],
      firstName: null,
    }
  }
  return res.json()
}

