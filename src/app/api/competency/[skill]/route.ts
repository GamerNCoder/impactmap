import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  decodeQuestionSet,
  gradeAnswers,
  isValidSkillKey,
  pickQuestions,
  questionsFromToken,
  encodeQuestionSet,
  toPublicQuestions,
  PASS_THRESHOLD_PERCENT,
} from '@/lib/competency-tests'
import { trackAppEvent } from '@/lib/track-event'
import { APP_EVENTS } from '@/lib/app-events'

type RouteParams = { params: Promise<{ skill: string }> }

export async function GET(_request: Request, { params }: RouteParams) {
  const { skill: rawSkill } = await params
  const skill = decodeURIComponent(rawSkill)

  if (!isValidSkillKey(skill)) {
    return NextResponse.json({ error: 'Invalid skill' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const questions = pickQuestions(skill)
  const token = encodeQuestionSet(skill, questions)

  void trackAppEvent({
    event: APP_EVENTS.COMPETENCY_START,
    userId: user.id,
    resourceType: 'skill',
    metadata: { skill },
  })

  return NextResponse.json({
    skill,
    passThreshold: PASS_THRESHOLD_PERCENT,
    questionCount: questions.length,
    token,
    questions: toPublicQuestions(questions),
  })
}

export async function POST(request: Request, { params }: RouteParams) {
  const { skill: rawSkill } = await params
  const skill = decodeURIComponent(rawSkill)

  if (!isValidSkillKey(skill)) {
    return NextResponse.json({ error: 'Invalid skill' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { token?: string; answers?: Record<string, number> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, answers } = body
  if (!token || !answers) {
    return NextResponse.json({ error: 'Token and answers required' }, { status: 400 })
  }

  const decoded = decodeQuestionSet(token)
  if (!decoded || decoded.skill !== skill) {
    return NextResponse.json({ error: 'Invalid or expired test token' }, { status: 400 })
  }

  const questions = questionsFromToken(token)
  if (!questions?.length) {
    return NextResponse.json({ error: 'Invalid or expired test token' }, { status: 400 })
  }

  const { scorePercent, passed, results } = gradeAnswers(questions, answers)
  const now = new Date().toISOString()

  await supabase.from('skill_competency_attempts').insert({
    user_id: user.id,
    skill_key: skill,
    score_percent: scorePercent,
    passed,
  })

  const { data: existing } = await supabase
    .from('skill_competency_results')
    .select('attempt_count, best_score, passed, passed_at')
    .eq('user_id', user.id)
    .eq('skill_key', skill)
    .maybeSingle()

  const attemptCount = (existing?.attempt_count ?? 0) + 1
  const bestScore = Math.max(existing?.best_score ?? 0, scorePercent)
  const alreadyPassed = existing?.passed === true
  const finalPassed = alreadyPassed || passed

  await supabase.from('skill_competency_results').upsert(
    {
      user_id: user.id,
      skill_key: skill,
      score_percent: scorePercent,
      passed: finalPassed,
      passed_at: finalPassed ? (existing?.passed_at ?? now) : null,
      attempt_count: attemptCount,
      best_score: bestScore,
      updated_at: now,
    },
    { onConflict: 'user_id,skill_key' }
  )

  void trackAppEvent({
    event: APP_EVENTS.COMPETENCY_COMPLETE,
    userId: user.id,
    resourceType: 'skill',
    metadata: { skill, score_percent: scorePercent, passed: finalPassed },
  })

  return NextResponse.json({
    scorePercent,
    passed: finalPassed,
    justPassed: passed && !alreadyPassed,
    passThreshold: PASS_THRESHOLD_PERCENT,
    results,
  })
}
