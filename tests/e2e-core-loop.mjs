// End-to-end check of the core loop against a running Supabase (local: `supabase start`).
// Run: node --env-file=.env.local tests/e2e-core-loop.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const run = Date.now()
const pastDate = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10)
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
    facilities: ['Restrooms', 'Drinking water'],
    status: 'open',
    latitude: 40.5285,
    longitude: -74.3915,
    start_date: pastDate,
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
const { data: opp } = await anon.from('opportunities').select('volunteers_count, facilities').eq('id', event.id).single()
check('volunteers_count synced', opp?.volunteers_count === 1, String(opp?.volunteers_count))
check('organizer-declared facilities are public', (opp?.facilities ?? []).length === 2, JSON.stringify(opp?.facilities))

// QR attendance: the check-in RPC records who turned up, is idempotent, and is readable
// only by the volunteer and the event's organizer.
const { error: anonCheckinErr } = await anon.rpc('check_in_event', { p_opportunity_id: event.id })
check('anonymous cannot check in', Boolean(anonCheckinErr), anonCheckinErr?.message)
const { data: checkin } = await student.client.rpc('check_in_event', { p_opportunity_id: event.id })
check('student check-in records attendance', checkin?.ok === true && checkin?.already === false, JSON.stringify(checkin))
check('check-in flags a scan outside the event window', checkin?.outside_window === true, JSON.stringify(checkin))
const { data: located } = await student.client.rpc('record_checkin_location', {
  p_opportunity_id: event.id,
  p_lat: 40.5286,
  p_lon: -74.3916,
})
check('check-in records distance without coordinates', located?.ok === true && located?.distance_m != null && located.distance_m < 100, JSON.stringify(located))
const { data: far } = await student.client.rpc('record_checkin_location', {
  p_opportunity_id: event.id,
  p_lat: 40.6,
  p_lon: -74.5,
})
check('a far location is recorded, not blocked', far?.ok === true && far?.distance_m > 1000, JSON.stringify(far))
const { data: attendanceRow } = await student.client
  .from('event_checkins')
  .select('*')
  .eq('opportunity_id', event.id)
  .eq('user_id', student.user.id)
  .single()
check('check-in stores no raw coordinates', !('checkin_lat' in (attendanceRow ?? {})) && !('checkin_lon' in (attendanceRow ?? {})), JSON.stringify(attendanceRow))
const { data: checkinAgain } = await student.client.rpc('check_in_event', { p_opportunity_id: event.id })
check('repeat check-in is idempotent', checkinAgain?.ok === true && checkinAgain?.already === true, JSON.stringify(checkinAgain))
const { data: organizerCheckins } = await coord.client
  .from('event_checkins')
  .select('id, source, distance_m, outside_window')
  .eq('opportunity_id', event.id)
  .eq('user_id', student.user.id)
check('organizer reads event attendance', organizerCheckins?.length === 1 && organizerCheckins[0].source === 'qr' && organizerCheckins[0].distance_m != null, JSON.stringify(organizerCheckins))
const { data: outsiderCheckins } = await intruder.client
  .from('event_checkins')
  .select('id')
  .eq('opportunity_id', event.id)
check('non-organizer cannot read event attendance', (outsiderCheckins ?? []).length === 0)

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

// Self-dealing: owning the org and posting the event must not let a student approve their
// own hours. RLS would allow the manager update; the trigger is the enforcement point.
const { data: selfOrg, error: selfOrgErr } = await student.client
  .from('organizations')
  .insert({ name: `Self-dealing org ${run}`, verified: false })
  .select('id')
  .single()
check('student creates org for self-dealing probe', !selfOrgErr, selfOrgErr?.message)

await student.client
  .from('organization_members')
  .insert({ organization_id: selfOrg.id, user_id: student.user.id, role: 'owner' })

const { data: selfEvent, error: selfEventErr } = await student.client
  .from('opportunities')
  .insert({
    organization_id: selfOrg.id,
    posted_by: student.user.id,
    title: 'Self-dealing event',
    description: 'Fixture',
    category: 'Environment',
    volunteers_needed: 2,
    status: 'open',
    start_date: pastDate,
  })
  .select('id')
  .single()
check('student posts own event for self-dealing probe', !selfEventErr, selfEventErr?.message)

await student.client.rpc('join_opportunity', { p_opportunity_id: selfEvent.id })
const { data: selfHour, error: selfHourErr } = await student.client
  .from('volunteer_hours')
  .insert({ user_id: student.user.id, opportunity_id: selfEvent.id, date: '2026-10-10', hours: 2 })
  .select('id')
  .single()
check('student logs own hours for self-dealing probe', Boolean(selfHour?.id), selfHourErr?.message)

const { error: selfApproveErr } = await student.client
  .from('volunteer_hours')
  .update({ verified: true, verification_code: code() })
  .eq('id', selfHour.id)
check('manager cannot approve own hours', Boolean(selfApproveErr), selfApproveErr?.message)

// Second account: the owner adds a coordinator; that coordinator still cannot issue a code
// to a volunteer who is a member of the same unverified organization.
await student.client
  .from('organization_members')
  .insert({ organization_id: selfOrg.id, user_id: intruder.user.id, role: 'coordinator' })
const { error: secondAccountErr } = await intruder.client
  .from('volunteer_hours')
  .update({ verified: true, verification_code: code() })
  .eq('id', selfHour.id)
check('unverified org cannot approve its own member through a second account', Boolean(secondAccountErr), secondAccountErr?.message)

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
const { data: publicHour } = await anon.rpc('verify_code', { p_code: hourCode })
check('anonymous counselor verifies hours code', Number(publicHour?.hours) === 3, JSON.stringify(publicHour))

const { data: publicCompletion } = await anon.rpc('verify_code', { p_code: completionCode })
check('anonymous counselor verifies completion code', publicCompletion?.status === 'completed')

// A misclicked approval is an audited soft revoke: the code stays, the row stops counting, and
// a manager can undo it. The RPC is not public; RLS alone is not the only gate.
const { data: impactBeforeRevoke } = await anon.rpc('impact_summary')
const { error: anonRevokeErr } = await anon.rpc('revoke_hours', { p_hours_id: hour.id })
check('anonymous cannot call the revoke RPC', Boolean(anonRevokeErr), anonRevokeErr?.message)

const { data: studentRevoke } = await student.client.rpc('revoke_hours', { p_hours_id: hour.id })
check('student cannot revoke their own approval', studentRevoke?.ok === false && studentRevoke?.error === 'not_manager', JSON.stringify(studentRevoke))

const { data: intruderRevoke } = await intruder.client.rpc('revoke_hours', { p_hours_id: hour.id })
check('non-organizer cannot revoke an approval', intruderRevoke?.ok === false && intruderRevoke?.error === 'not_manager', JSON.stringify(intruderRevoke))

const { data: pendingRevoke } = await intruder.client.rpc('revoke_hours', { p_hours_id: selfHour.id })
check('a pending log cannot be revoked', pendingRevoke?.ok === false && pendingRevoke?.error === 'not_approved', JSON.stringify(pendingRevoke))

const { data: revoked } = await coord.client.rpc('revoke_hours', { p_hours_id: hour.id })
check('coordinator revokes an approval', revoked?.ok === true, JSON.stringify(revoked))
const { data: revokedRow } = await coord.client
  .from('volunteer_hours')
  .select('verified, verification_code, revoked_at, revoked_by')
  .eq('id', hour.id)
  .single()
// A direct table write must not be able to rewrite an existing revocation, and it must not add
// a second revoke audit row.
const firstRevokedAt = revokedRow?.revoked_at
const { error: rewriteErr } = await coord.client
  .from('volunteer_hours')
  .update({ revoked_at: '2000-01-01T00:00:00Z', revoked_by: intruder.user.id })
  .eq('id', hour.id)
const { data: stillRevoked } = await coord.client
  .from('volunteer_hours')
  .select('verified, verification_code, revoked_at, revoked_by')
  .eq('id', hour.id)
  .single()
check('revoke keeps the code and an existing revocation is immutable', !rewriteErr && stillRevoked?.verified === true && stillRevoked?.verification_code === hourCode && stillRevoked?.revoked_at === firstRevokedAt && stillRevoked?.revoked_by === coord.user.id, JSON.stringify(stillRevoked))

const { data: studentView } = await student.client
  .from('volunteer_hours')
  .select('verification_code, revoked_at')
  .eq('id', hour.id)
  .single()
check('the student still sees the revoked record and its code', Boolean(studentView?.revoked_at) && studentView?.verification_code === hourCode, JSON.stringify(studentView))

const { data: revokedPublic } = await anon.rpc('verify_code', { p_code: hourCode })
check('a revoked code answers as revoked, not a 404', revokedPublic?.status === 'revoked' && Number(revokedPublic?.hours) === 3, JSON.stringify(revokedPublic))
const { data: impactAfterRevoke } = await anon.rpc('impact_summary')
check('revoked hours leave the public impact total', Number(impactAfterRevoke?.totals?.hours) === Number(impactBeforeRevoke?.totals?.hours) - 3, `${impactBeforeRevoke?.totals?.hours} -> ${impactAfterRevoke?.totals?.hours}`)

const { data: revokeAudit } = await coord.client
  .from('security_audit_log')
  .select('action')
  .eq('resource_id', hour.id)
  .eq('action', 'hours.revoke')
check('revocation writes an audit row', (revokeAudit ?? []).length === 1, JSON.stringify(revokeAudit))

const { data: intruderUpdate } = await intruder.client
  .from('volunteer_hours')
  .update({ revoked_at: new Date().toISOString() })
  .eq('id', hour.id)
  .select('id')
check('non-manager cannot revoke by writing the table directly', (intruderUpdate ?? []).length === 0)

const { data: restored } = await coord.client.rpc('restore_hours', { p_hours_id: hour.id })
check('coordinator restores a revoked approval', restored?.ok === true, JSON.stringify(restored))
const { data: restoredPublic } = await anon.rpc('verify_code', { p_code: hourCode })
check('a restored code verifies again', restoredPublic?.status == null && Number(restoredPublic?.hours) === 3, JSON.stringify(restoredPublic))
const { data: impactAfterRestore } = await anon.rpc('impact_summary')
check('restored hours return to the public impact total', Number(impactAfterRestore?.totals?.hours) === Number(impactBeforeRevoke?.totals?.hours), `${impactAfterRestore?.totals?.hours}`)
const { data: restoreAudit } = await coord.client
  .from('security_audit_log')
  .select('action')
  .eq('resource_id', hour.id)
  .eq('action', 'hours.restore')
check('restore writes an audit row', (restoreAudit ?? []).length === 1, JSON.stringify(restoreAudit))

// Small-cell suppression: a cause with 3 distinct volunteers is published; a cause with one
// volunteer is not. Seed two more students on a second event for the visible group.
const student2 = await signUp('student2')
const student3 = await signUp('student3')
const { data: event2 } = await coord.client
  .from('opportunities')
  .insert({
    organization_id: org.id,
    posted_by: coord.user.id,
    title: 'Trail cleanup 2',
    description: 'Fixture',
    category: 'Environment',
    volunteers_needed: 3,
    status: 'open',
    start_date: pastDate,
  })
  .select('id')
  .single()

for (const s of [student, student2, student3]) {
  await s.client.rpc('join_opportunity', { p_opportunity_id: event2.id })
  const { data: h } = await s.client
    .from('volunteer_hours')
    .insert({ user_id: s.user.id, opportunity_id: event2.id, date: '2026-10-10', hours: 1 })
    .select('id')
    .single()
  await coord.client
    .from('volunteer_hours')
    .update({ verified: true, verification_code: code(), verified_at: new Date().toISOString() })
    .eq('id', h.id)
}

const { data: soloEvent } = await coord.client
  .from('opportunities')
  .insert({
    organization_id: org.id,
    posted_by: coord.user.id,
    title: 'Solo fixture event',
    description: 'Fixture',
    category: 'Other',
    volunteers_needed: 1,
    status: 'open',
    start_date: pastDate,
  })
  .select('id')
  .single()
await student.client.rpc('join_opportunity', { p_opportunity_id: soloEvent.id })
const { data: soloHour } = await student.client
  .from('volunteer_hours')
  .insert({ user_id: student.user.id, opportunity_id: soloEvent.id, date: '2026-10-10', hours: 1 })
  .select('id')
  .single()
await coord.client
  .from('volunteer_hours')
  .update({ verified: true, verification_code: code(), verified_at: new Date().toISOString() })
  .eq('id', soloHour.id)

// The public impact page reads an aggregate RPC; it must work for anon and never leak identities.
const { data: impact, error: impactErr } = await anon.rpc('impact_summary')
check('public impact summary works', !impactErr && (impact?.totals?.records ?? 0) >= 1, impactErr?.message)
check('impact summary groups verified hours by cause', (impact?.by_category ?? []).some((row) => row.category === 'Environment'))
check('impact summary keeps student identity out', !JSON.stringify(impact ?? {}).includes(student.user.id))
check('impact suppresses groups under 3 volunteers', !(impact?.by_category ?? []).some((row) => row.category === 'Other'))

const { data: publicName } = await anon.from('profiles').select('full_name').eq('id', student.user.id).single()
check('public sees student name', publicName?.full_name === 'Test student')
const { error: emailErr } = await anon.from('profiles').select('email').eq('id', student.user.id).single()
check('public cannot read student email', Boolean(emailErr))
// Regression: anon once held column grants for location/bio/skills (policy USING (true)),
// so any visitor could enumerate every student's town, bio and skills.
const { error: anonLocErr } = await anon.from('profiles').select('location').eq('id', student.user.id).single()
check('public cannot read student location', Boolean(anonLocErr))
const { error: anonBioErr } = await anon.from('profiles').select('bio').eq('id', student.user.id).single()
check('public cannot read student bio', Boolean(anonBioErr))
const { error: anonSkillsErr } = await anon.from('profiles').select('skills').eq('id', student.user.id).single()
check('public cannot read student skills', Boolean(anonSkillsErr))
const { error: anonAdminErr } = await anon.from('profiles').select('is_platform_admin').eq('id', student.user.id).single()
check('public cannot read platform-admin flag', Boolean(anonAdminErr))
// Availability is owner-only: it must never leak to anon or to other signed-in accounts.
const { error: anonAvailErr } = await anon.from('profiles').select('volunteer_availability').eq('id', student.user.id).single()
check('public cannot read student availability', Boolean(anonAvailErr))

// is_platform_admin is not column-readable by authenticated users, so confirm the guard through
// the SECURITY DEFINER helper instead of a RETURNING read.
await student.client
  .from('profiles')
  .update({ is_platform_admin: true })
  .eq('id', student.user.id)
const { data: adminNow } = await student.client.rpc('is_platform_admin')
check('student cannot make self admin', adminNow === false)

// Audit integrity: a row must belong to its author; an unattributed entry is rejected.
const { error: nullAuditErr } = await student.client
  .from('security_audit_log')
  .insert({ user_id: null, action: 'probe.unattributed' })
check('signed-in users cannot write unattributed audit rows', Boolean(nullAuditErr), nullAuditErr?.message)
const { error: ownAuditErr } = await student.client
  .from('security_audit_log')
  .insert({ user_id: student.user.id, action: 'probe.own' })
check('signed-in users can write their own audit row', !ownAuditErr, ownAuditErr?.message)
const { error: anonAuditErr } = await anon
  .from('security_audit_log')
  .insert({ user_id: null, action: 'probe.anon' })
check('public cannot write audit rows', Boolean(anonAuditErr), anonAuditErr?.message)

// Minor privacy: other signed-in users (e.g. adult organizers) see names, not contact details.
const { error: peerEmailErr } = await intruder.client.from('profiles').select('email').eq('id', student.user.id).single()
check('signed-in users cannot read student email', Boolean(peerEmailErr))
const { error: peerDobErr } = await intruder.client.from('profiles').select('date_of_birth').eq('id', student.user.id).single()
check('signed-in users cannot read student birthday', Boolean(peerDobErr))
const { error: peerLocErr } = await intruder.client.from('profiles').select('location').eq('id', student.user.id).single()
check('signed-in users cannot read student location', Boolean(peerLocErr))
const { error: peerBioErr } = await intruder.client.from('profiles').select('bio').eq('id', student.user.id).single()
check('signed-in users cannot read student bio', Boolean(peerBioErr))
const { error: peerAvailErr } = await intruder.client.from('profiles').select('volunteer_availability').eq('id', student.user.id).single()
check('signed-in users cannot read student availability', Boolean(peerAvailErr))
const { error: setAvailErr } = await student.client
  .from('profiles')
  .update({ volunteer_availability: ['Mon-morning', 'Sat-afternoon'] })
  .eq('id', student.user.id)
check('student sets own availability', !setAvailErr, setAvailErr?.message)
const { data: mine } = await student.client.rpc('my_profile').single()
check('student reads own private profile', mine?.email === `student-${run}@example.com`)
check('student reads own availability', (mine?.volunteer_availability ?? []).length === 2)
const { data: goal } = await student.client
  .from('profiles').update({ hours_goal: 40 }).eq('id', student.user.id).select('hours_goal').single()
check('student sets hours goal', goal?.hours_goal === 40)

// Account deletion removes the auth row and cascades to everything the user owns.
const deleter = await signUp('deleter')
const { data: deleterEvent } = await coord.client
  .from('opportunities')
  .insert({
    organization_id: org.id,
    posted_by: coord.user.id,
    title: 'Deletion fixture event',
    description: 'Fixture',
    category: 'Other',
    volunteers_needed: 5,
    status: 'open',
  })
  .select('id')
  .single()
await deleter.client.rpc('join_opportunity', { p_opportunity_id: deleterEvent.id })
const { data: deleterHour, error: deleterHourErr } = await deleter.client
  .from('volunteer_hours')
  .insert({ user_id: deleter.user.id, opportunity_id: deleterEvent.id, date: '2026-10-10', hours: 2 })
  .select('id')
  .single()
check('deleter logs hours', Boolean(deleterHour?.id), deleterHourErr?.message)
await deleter.client.rpc('check_in_event', { p_opportunity_id: deleterEvent.id })
const { data: deletion } = await deleter.client.rpc('delete_my_account')
check('account deletion returns ok', deletion?.ok === true, JSON.stringify(deletion))
const { data: deletedProfile } = await anon.from('profiles').select('id').eq('id', deleter.user.id)
check('deleted account profile is gone', (deletedProfile ?? []).length === 0)
const { data: deletedHours } = await coord.client.from('volunteer_hours').select('id').eq('user_id', deleter.user.id)
check('deleted account hours are gone', (deletedHours ?? []).length === 0)
const { data: deletedCheckins } = await coord.client.from('event_checkins').select('id').eq('user_id', deleter.user.id)
check('deleted account check-ins are gone', (deletedCheckins ?? []).length === 0)
const { data: deletedAuth } = await deleter.client.auth.getUser()
check('deleted account cannot authenticate', deletedAuth?.user == null)

// Retired SaaS-build tables: empty and unused, but once reachable through the Data API.
// The revoke migration must keep them inaccessible to both anonymous and signed-in callers.
const retiredTables = [
  'volunteer_reviews',
  'user_badges',
  'skill_competency_results',
  'skill_competency_attempts',
  'id_verification_submissions',
  'org_api_keys',
  'org_webhooks',
  'transfer_requests',
  'community_groups',
  'group_members',
  'shared_posts',
]
for (const table of retiredTables) {
  const { error: anonRetiredErr } = await anon.from(table).select('id').limit(1)
  check(`public cannot read retired table ${table}`, Boolean(anonRetiredErr))
  const { error: authRetiredErr } = await intruder.client.from(table).select('id').limit(1)
  check(`signed-in users cannot read retired table ${table}`, Boolean(authRetiredErr))
}

console.log(failures ?`\n${failures} check(s) failed` : '\nAll checks passed')
process.exit(failures ? 1 : 0)
