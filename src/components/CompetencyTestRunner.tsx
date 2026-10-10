'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PublicQuestion } from '@/lib/competency-tests'
import { PASS_THRESHOLD_PERCENT } from '@/lib/competency-tests'

type TestPayload = {
  skill: string
  passThreshold: number
  questionCount: number
  token: string
  questions: PublicQuestion[]
}

export type GradeResult = {
  scorePercent: number
  passed: boolean
  justPassed: boolean
  passThreshold: number
  results: { id: string; correct: boolean; explanation: string }[]
}

type CompetencyTestRunnerProps = {
  skill: string
  onCancel?: () => void
  onComplete?: (result: GradeResult) => void
}

export default function CompetencyTestRunner({ skill, onCancel, onComplete }: CompetencyTestRunnerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [test, setTest] = useState<TestPayload | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [step, setStep] = useState(0)
  const [grade, setGrade] = useState<GradeResult | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return
        setLoading(true)
        setError(null)
        setGrade(null)
        setAnswers({})
        setStep(0)
        try {
          const res = await fetch(`/api/competency/${encodeURIComponent(skill)}`)
          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error ?? 'Failed to load test')
          }
          const data = (await res.json()) as TestPayload
          if (!cancelled) setTest(data)
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'Failed to load test')
          }
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [skill])

  const currentQuestion = test?.questions[step]
  const allAnswered = test ? test.questions.every((q) => answers[q.id] !== undefined) : false

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const submitTest = async () => {
    if (!test || !allAnswered) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/competency/${encodeURIComponent(skill)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: test.token, answers }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to submit test')
      }
      const result = (await res.json()) as GradeResult
      setGrade(result)
      onComplete?.(result)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Loading {skill} competency test…</p>
      </div>
    )
  }

  const retakeTest = () => {
    setTest(null)
    setGrade(null)
    setError(null)
    setAnswers({})
    setStep(0)
    setLoading(true)
    void fetch(`/api/competency/${encodeURIComponent(skill)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load test')
        }
        return res.json() as Promise<TestPayload>
      })
      .then((data) => {
        setTest(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load test')
        setLoading(false)
      })
  }

  if (error && !test) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-6">
        <p className="text-red-700 dark:text-red-300">{error}</p>
        <button type="button" onClick={retakeTest} className="mt-3 text-sm text-red-800 dark:text-red-200 underline">
          Try again
        </button>
      </div>
    )
  }

  if (grade && test) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 space-y-6">
        <div className="text-center">
          <p className={`text-4xl font-bold ${grade.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
            {grade.scorePercent}%
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
            {grade.justPassed
              ? `${skill} verified!`
              : grade.passed
                ? 'Already verified — score updated'
                : `Need ${grade.passThreshold}% to verify`}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {grade.passed
              ? 'This skill now shows as competency-verified on your profile.'
              : `You answered ${grade.results.filter((r) => r.correct).length} of ${grade.results.length} correctly.`}
          </p>
        </div>

        <div className="space-y-3">
          {test.questions.map((q, i) => {
            const result = grade.results.find((r) => r.id === q.id)
            return (
              <div
                key={q.id}
                className={`rounded-lg p-4 text-sm ${
                  result?.correct
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900'
                    : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'
                }`}
              >
                <p className="font-medium text-gray-900 dark:text-white">
                  {i + 1}. {q.question}
                </p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{result?.explanation}</p>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {!grade.passed && (
            <button
              type="button"
              onClick={retakeTest}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
            >
              Retake test
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to skills
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!test || !currentQuestion) return null

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{skill} competency test</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {PASS_THRESHOLD_PERCENT}% to pass · {test.questionCount} questions
          </p>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {step + 1} / {test.questions.length}
        </span>
      </div>

      <div className="mb-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${((step + 1) / test.questions.length) * 100}%` }}
        />
      </div>

      <fieldset className="mt-6">
        <legend className="text-base font-medium text-gray-900 dark:text-white mb-4">
          {currentQuestion.question}
        </legend>
        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => {
            const selected = answers[currentQuestion.id] === index
            return (
              <label
                key={option}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  checked={selected}
                  onChange={() => selectAnswer(currentQuestion.id, index)}
                  className="text-emerald-600"
                />
                <span className="text-gray-800 dark:text-gray-200">{option}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-8">
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Cancel
            </button>
          )}
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Previous
            </button>
          )}
        </div>

        {step < test.questions.length - 1 ? (
          <button
            type="button"
            disabled={answers[currentQuestion.id] === undefined}
            onClick={() => setStep((s) => s + 1)}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            Next
          </button>
        ) : (
          <button
            type="button"
            disabled={!allAnswered || submitting}
            onClick={submitTest}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit answers'}
          </button>
        )}
      </div>
    </div>
  )
}
