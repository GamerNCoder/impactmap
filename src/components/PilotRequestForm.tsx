'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const inputClass =
  'appearance-none rounded-lg block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export default function PilotRequestForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    const form = new FormData(event.currentTarget)
    const payload = {
      organizationName: form.get('organizationName'),
      contactName: form.get('contactName'),
      email: form.get('email'),
      role: form.get('role'),
      message: form.get('message'),
    }

    try {
      const response = await fetch('/api/pilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Could not send the request.')
      }
      setStatus('sent')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send the request.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-6"
      >
        <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Request received</h2>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">
          Thanks — we&apos;ll reply by email with a short setup checklist and a time to run the first
          event. Nothing is created until you say go.
        </p>
        <a
          href="/pilot/guide"
          className="mt-4 inline-block text-sm font-semibold text-emerald-800 dark:text-emerald-300 underline underline-offset-2"
        >
          Read the one-page pilot guide →
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pilot-org" className={labelClass}>
            School, club or organization
          </label>
          <input id="pilot-org" name="organizationName" required maxLength={160} className={inputClass} placeholder="Edison High School NHS" />
        </div>
        <div>
          <label htmlFor="pilot-name" className={labelClass}>
            Your name
          </label>
          <input id="pilot-name" name="contactName" required maxLength={120} className={inputClass} placeholder="Alex Johnson" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pilot-email" className={labelClass}>
            Email
          </label>
          <input id="pilot-email" name="email" type="email" required maxLength={200} className={inputClass} placeholder="you@school.edu" />
        </div>
        <div>
          <label htmlFor="pilot-role" className={labelClass}>
            Your role
          </label>
          <select id="pilot-role" name="role" className={inputClass} defaultValue="counselor">
            <option value="counselor">School counselor</option>
            <option value="teacher">Teacher or advisor</option>
            <option value="organizer">Club or nonprofit organizer</option>
            <option value="student">Student</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="pilot-message" className={labelClass}>
          Anything we should know? (optional)
        </label>
        <textarea
          id="pilot-message"
          name="message"
          rows={4}
          maxLength={2000}
          className={inputClass}
          placeholder="How many students, what kind of event, and when you would like to run it."
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full sm:w-auto rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 motion-pressable"
      >
        {status === 'sending' ? 'Sending…' : 'Request a pilot'}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        We use this only to reply about a pilot. No student data is involved at this step.
      </p>
    </form>
  )
}
