'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { fetchAiContext, requestAi } from '@/lib/ai-client'
import AiBadge from '@/components/AiBadge'

type Message = { role: 'user' | 'assistant'; text: string; source?: string }

const DEFAULT_GREETING =
  "Hey! I'm Impact Copilot ✨ Ask me about SkillMatch, verifying hours, your Passport, or hosting events."

const DEFAULT_SUGGESTIONS = [
  'What event should I join?',
  'How do I verify my hours?',
  'Help with my Impact Passport',
]

export default function ImpactCopilot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: DEFAULT_GREETING, source: 'impactmap' },
  ])
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [contextLoaded, setContextLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (!open || contextLoaded) return
    fetchAiContext().then((ctx) => {
      setMessages([{ role: 'assistant', text: ctx.greeting, source: 'impactmap' }])
      setSuggestions(ctx.suggestions)
      setContextLoaded(true)
    })
  }, [open, contextLoaded])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', text: text.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const history = nextMessages
        .slice(0, -1)
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.text }))

      const { text: reply, source } = await requestAi(
        'copilot',
        { message: text.trim(), page: pathname },
        { history }
      )
      setMessages((m) => [...m, { role: 'assistant', text: reply, source }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Something went wrong — try again in a moment.', source: 'impactmap' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all"
        aria-label={open ? 'Close Impact Copilot' : 'Open Impact Copilot'}
      >
        <span className="text-lg" aria-hidden>✨</span>
        {open ? 'Close' : 'Copilot'}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[min(100vw-2rem,22rem)] h-[min(70vh,28rem)] flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
            <p className="font-semibold text-sm">Impact Copilot</p>
            <p className="text-xs text-violet-100">Personalized to your profile &amp; goals</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {msg.role === 'assistant' && msg.source && (
                    <div className="mb-1">
                      <AiBadge source={msg.source} />
                    </div>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-violet-500 animate-pulse">Copilot is thinking…</p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-2 flex flex-wrap gap-1">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="text-xs px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 hover:bg-violet-100"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="p-3 border-t border-gray-100 dark:border-gray-800 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              className="flex-1 text-sm rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 dark:bg-gray-900"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
