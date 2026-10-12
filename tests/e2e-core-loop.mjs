// End-to-end check of the core loop against a running Supabase (local: `supabase start`).
// Run: node --env-file=.env.local tests/e2e-core-loop.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const run = Date.now()
let failures = 0

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

async function signUp(label) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const email = `${label}-${run}@example.com`
  const { data, error } = await client.auth.signUp({
    email,
    password: 'test-password-123',
    options: { data: { full_name: `Test ${label}` } },
  })
  if (error) throw error
  return { client, user: data.user }
}

const code = () => `IMP-${crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`

const coord = await signUp('coordinator')
const student = await signUp('student')
const intruder = await signUp('intruder')
const anon = createClient(url, anonKey, { auth: { persistSession: false } })

// Coordinator creates an organization and claims ownership.
const { data: org, error: orgErr } = await coord.client
  .from('organizations')
  .insert({ name: `Test Org ${run}`, verified: true, plan_tier: 'starter' })
  .select('id, verified')
  .single()
check('coordinator creates organization', !orgErr, orgErr?.message)
check('self-created org is not auto-verified', org?.verified === false)

const { error: hijackErr } = await intruder.client
  .from('organization_members')
  .insert({ organization_id: org.id, user_id: intruder.user.id, role: 'owner' })
check('intruder cannot claim someone else’s new org', Boolean(hijackErr))

const { error: memberErr } = await coord.client
  .from('organization_members')
  .insert({ organization_id: org.id, user_id: coord.user.id, role: 'owner' })
check('creator claims ownership', !memberErr, memberErr?.message)

const { data: event, error: eventErr } = await coord.client
  .from('opportunities')
  .insert({
    organization_id: org.id,
    posted_by: coord.user.id,
    title: 'Park cleanup',
    description: 'Pick up litter',
    category: 'Environment',
    volunteers_needed: 1,
    status: 'open',
  })
  .select('id')
  .single()
check('coordinator posts event', !eventErr, eventErr?.message)

const { error: intruderEventErr } = await intruder.client
  .from('opportunities')
  .insert({ organization_id: org.id, title: 'Fake', description: 'x', category: 'Other' })
check('non-member cannot post events for the org', Boolean(intruderEventErr))

// Student joins (QR check-in lands on the event page and calls join_opportunity).
const { data: joined } = await student.client.rpc('join_opportunity', { p_opportunity_id: event.id })
check('student joins event', joined?.ok === true, JSON.stringify(joined))
const { data: again } = await student.client.rpc('join_opportunity', { p_opportunity_id: event.id })
check('double join reports already_joined', again?.error === 'already_joined')
const { data: full } = await intruder.client.rpc('join_opportunity', { p_opportunity_id: event.id })
check('capacity enforced', full?.error === 'full', JSON.stringify(full))
const { data: opp } = await anon.from('opportunities').select('volunteers_count').eq('id', event.id).single()
check('volunteers_count synced', opp?.volunteers_count === 1, String(opp?.volunteers_count))

// Student logs hours; cannot self-verify.
const { data: hour, error: hourErr } = await student.client
  .from('volunteer_hours')
  .insert({ user_id: student.user.id, opportunity_id: event.id, date: '2026-10-10', hours: 3 })
  .select('id')
  .single()
check('student logs hours', !hourErr, hourErr?.message)

const { error: fakeHourErr } = await student.client
  .from('volunteer_hours')
  .insert({ user_id: student.user.id, opportunity_id: event.id, date: '2026-10-10', hours: 5, verified: true, verification_code: code() })
check('student cannot insert pre-verified hours', Boolean(fakeHourErr))

const { data: selfVerify } = await student.client
  .from('volunteer_hours')
  .update({ verified: true, verification_code: code() })
  .eq('id', hour.id)
  .select('id')
check('student cannot verify own hours', (selfVerify ?? []).length === 0)

const { error: selfCompleteErr } = await student.client
  .from('applications')
  .update({ status: 'completed', verification_code: code() })
  .eq('opportunity_id', event.id)
  .eq('user_id', student.user.id)
check('student cannot mark own completion', Boolean(selfCompleteErr))

const { data: intruderHours } = await intruder.client.from('volunteer_hours').select('id').eq('id', hour.id)
check('other users cannot read unverified hours', (intruderHours ?? []).length === 0)

// Coordinator approves hours and completion.
const hourCode = code()
const { data: verified, error: verifyErr } = await coord.client
  .from('volunteer_hours')
  .update({ verified: true, verified_by: coord.user.id, verified_at: new Date().toISOString(), verification_code: hourCode, supervisor_name: 'Ms. Lee', supervisor_title: 'Coordinator' })
  .eq('id', hour.id)
  .eq('verified', false)
  .select('id')
check('coordinator verifies hours', !verifyErr && verified?.length === 1, verifyErr?.message)

const completionCode = code()
const { data: completed, error: completeErr } = await coord.client
  .from('applications')
  .update({ status: 'completed', completed_at: new Date().toISOString(), verified_at: new Date().toISOString(), verified_by: coord.user.id, verification_code: completionCode })
  .eq('opportunity_id', event.id)
  .eq('user_id', student.user.id)
  .select('id')
check('coordinator verifies completion', !completeErr && completed?.length === 1, completeErr?.message)

// Anyone (counselor) can verify the IMP- code without signing in.
const { data: publicHour } = await anon
  .from('volunteer_hours')
  .select('hours, opportunities(title, organizations(name))')
  .eq('verification_code', hourCode)
  .eq('verified', true)
  .maybeSingle()
check('anonymous counselor verifies hours code', Number(publicHour?.hours) === 3, JSON.stringify(publicHour))

const { data: publicCompletion } = await anon
  .from('applications')
  .select('status')
  .eq('verification_code', completionCode)
  .maybeSingle()
check('anonymous counselor verifies completion code', publicCompletion?.status === 'completed')

const { data: publicName } = await anon.from('profiles').select('full_name').eq('id', student.user.id).single()
check('public sees student name', publicName?.full_name === 'Test student')
const { error: emailErr } = await anon.from('profiles').select('email').eq('id', student.user.id).single()
check('public cannot read student email', Boolean(emailErr))

const { data: adminTry } = await student.client
  .from('profiles')
  .update({ is_platform_admin: true })
  .eq('id', student.user.id)
  .select('is_platform_admin')
  .single()
check('student cannot make self admin', adminTry?.is_platform_admin === false)

// Minor privacy: other signed-in users (e.g. adult organizers) see names, not contact details.
const { error: peerEmailErr } = await intruder.client.from('profiles').select('email').eq('id', student.user.id).single()
check('signed-in users cannot read student email', Boolean(peerEmailErr))
const { error: peerDobErr } = await intruder.client.from('profiles').select('date_of_birth').eq('id', student.user.id).single()
check('signed-in users cannot read student birthday', Boolean(peerDobErr))
const { data: mine } = await student.client.rpc('my_profile').single()
check('student reads own private profile', mine?.email === `student-${run}@example.com`)
const { data: goal } = await student.client
  .from('profiles').update({ hours_goal: 40 }).eq('id', student.user.id).select('hours_goal').single()
check('student sets hours goal', goal?.hours_goal === 40)

console.log(failures ?`\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
