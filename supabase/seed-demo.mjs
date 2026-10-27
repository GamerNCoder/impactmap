// Idempotent demo data for the shared demo accounts.
//
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   DEMO_STUDENT_PASSWORD=... DEMO_ORGANIZER_PASSWORD=... \
//   node supabase/seed-demo.mjs
//
// Safe to re-run: every row has a fixed id and is upserted, so a judge's edits are reset and
// the auth users keep working. Prints only counts and email addresses — never passwords.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Need NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

const studentEmail = process.env.DEMO_STUDENT_EMAIL ?? 'demo.student@impactmap.app'
const organizerEmail = process.env.DEMO_ORGANIZER_EMAIL ?? 'demo.organizer@impactmap.app'
const studentPassword = process.env.DEMO_STUDENT_PASSWORD
const organizerPassword = process.env.DEMO_ORGANIZER_PASSWORD

if (!studentPassword || !organizerPassword) {
  console.error('Need DEMO_STUDENT_PASSWORD and DEMO_ORGANIZER_PASSWORD.')
  process.exit(1)
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } })

const TERMS_VERSION = '2026-06-22'
const ORG_ID = '33333333-3333-3333-3333-333333333301'
const EVENT_1 = '44444444-4444-4444-4444-444444444401'
const EVENT_2 = '44444444-4444-4444-4444-444444444402'
const EVENT_3 = '44444444-4444-4444-4444-444444444403'
const APP_1 = '55555555-5555-5555-5555-555555555501'
const APP_2 = '55555555-5555-5555-5555-555555555502'
const APP_3 = '55555555-5555-5555-5555-555555555503'
const HOURS_VERIFIED = '66666666-6666-6666-6666-666666666601'
const HOURS_VERIFIED_EDU = '66666666-6666-6666-6666-666666666603'
const HOURS_VERIFIED_COMMUNITY = '66666666-6666-6666-6666-666666666604'
const HOURS_PENDING = '66666666-6666-6666-6666-666666666602'
const CHECKIN_1 = '77777777-7777-7777-7777-777777777701'
const DEMO_CODE = 'IMP-DEMO2026ABCD'

const day = (offset) => {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}
const now = new Date().toISOString()

function fail(error, what) {
  if (error) throw new Error(`${what}: ${error.message}`)
}

async function ensureUser(email, password, fullName) {
  const { data: list, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
  fail(listError, 'list users')
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

  if (existing) {
    const { error } = await db.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })
    fail(error, `update ${email}`)
    return existing
  }

  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  fail(error, `create ${email}`)
  return data.user
}

const student = await ensureUser(studentEmail, studentPassword, 'Demo Student')
const organizer = await ensureUser(organizerEmail, organizerPassword, 'Demo Organizer')

fail(
  (await db.from('profiles').update({
    full_name: 'Demo Student',
    email: studentEmail,
    date_of_birth: '2008-05-01',
    hours_goal: 40,
    terms_accepted_at: now,
    terms_version: TERMS_VERSION,
  }).eq('id', student.id)).error,
  'student profile'
)

fail(
  (await db.from('profiles').update({
    full_name: 'Demo Organizer',
    email: organizerEmail,
    date_of_birth: '1985-01-01',
    terms_accepted_at: now,
    terms_version: TERMS_VERSION,
  }).eq('id', organizer.id)).error,
  'organizer profile'
)

fail(
  (await db.from('organizations').upsert({
    id: ORG_ID,
    name: 'Edison Community Volunteers',
    description:
      'A demo organization used to show organizers posting events, checking attendance and approving hours.',
    location: 'Edison, NJ',
    verified: false,
    created_by: organizer.id,
  }, { onConflict: 'id' })).error,
  'organization'
)

fail(
  (await db.from('organization_members').upsert({
    organization_id: ORG_ID,
    user_id: organizer.id,
    role: 'owner',
  }, { onConflict: 'organization_id,user_id' })).error,
  'organization member'
)

const events = [
  {
    id: EVENT_1,
    organization_id: ORG_ID,
    posted_by: organizer.id,
    title: 'Roosevelt Park Trail Cleanup',
    description:
      'Pick up litter around the lake and trails, clear leaves from the paths, and help sort recycling. Gloves and bags are provided.',
    category: 'Environment',
    skills_required: ['Outdoor work'],
    location: 'Roosevelt Park, Edison, NJ',
    remote: false,
    time_commitment: 'One-time, 3 hours',
    start_date: day(-30),
    deadline: day(30),
    volunteers_needed: 40,
    volunteers_count: 1,
    status: 'open',
    requirements: 'Ages 13+. Closed-toe shoes.',
    benefits: 'Verified service hours, group photo.',
    latitude: 40.547088,
    longitude: -74.341672,
    wheelchair_accessible: true,
    accessible_restroom: true,
    sensory_friendly: false,
    substance_free: true,
  },
  {
    id: EVENT_2,
    organization_id: ORG_ID,
    posted_by: organizer.id,
    title: 'After-School Tutoring',
    description:
      'Help elementary and middle schoolers with reading and math homework at the Edison library.',
    category: 'Education',
    skills_required: ['Patience', 'Communication'],
    location: 'Edison Public Library, Plainfield Ave, Edison, NJ',
    remote: false,
    time_commitment: '2 hours/week',
    start_date: day(-60),
    deadline: day(45),
    volunteers_needed: 15,
    volunteers_count: 1,
    status: 'open',
    requirements: 'Ages 14+. Weekly commitment for at least one month.',
    benefits: 'Verified service hours, recommendation letter after 20 hours.',
    latitude: 40.517465,
    longitude: -74.408179,
    wheelchair_accessible: true,
    accessible_restroom: true,
    sensory_friendly: true,
    substance_free: true,
  },
  {
    id: EVENT_3,
    organization_id: ORG_ID,
    posted_by: organizer.id,
    title: 'Senior Tech Help (Virtual)',
    description:
      'Walk seniors through video calls, email and phone settings over a scheduled video chat.',
    category: 'Community',
    skills_required: ['Patience', 'Tech basics'],
    location: null,
    remote: true,
    time_commitment: '1 hour/week',
    start_date: day(-90),
    deadline: day(90),
    volunteers_needed: 10,
    volunteers_count: 1,
    status: 'open',
    requirements: 'Ages 13+. Reliable internet connection.',
    benefits: 'Verified service hours, remote volunteering experience.',
    latitude: null,
    longitude: null,
    wheelchair_accessible: false,
    accessible_restroom: false,
    sensory_friendly: true,
    substance_free: true,
  },
]

fail(
  (await db.from('opportunities').upsert(events, { onConflict: 'id' })).error,
  'events'
)

fail(
  (await db.from('applications').upsert([
    {
      id: APP_1,
      opportunity_id: EVENT_1,
      user_id: student.id,
      status: 'accepted',
    },
    {
      id: APP_2,
      opportunity_id: EVENT_2,
      user_id: student.id,
      status: 'accepted',
    },
    {
      id: APP_3,
      opportunity_id: EVENT_3,
      user_id: student.id,
      status: 'accepted',
    },
  ], { onConflict: 'id' })).error,
  'applications'
)

fail(
  (await db.from('event_checkins').upsert({
    id: CHECKIN_1,
    opportunity_id: EVENT_1,
    user_id: student.id,
    checked_in_at: now,
    source: 'qr',
    distance_m: 42,
    outside_window: false,
  }, { onConflict: 'id' })).error,
  'check-in'
)

fail(
  (await db.from('volunteer_hours').upsert([
    {
      id: HOURS_VERIFIED,
      user_id: student.id,
      opportunity_id: EVENT_1,
      date: day(-7),
      hours: 3,
      description: 'Collected four bags of litter and cleared the trail edge.',
      verified: true,
      verified_by: organizer.id,
      verified_at: now,
      verification_code: DEMO_CODE,
      revoked_at: null,
      revoked_by: null,
      supervisor_name: 'Demo Organizer',
      supervisor_title: 'Event organizer',
    },
    {
      id: HOURS_VERIFIED_EDU,
      user_id: student.id,
      opportunity_id: EVENT_2,
      date: day(-30),
      hours: 2,
      description: 'Helped two students with fractions and reading.',
      verified: true,
      verified_by: organizer.id,
      verified_at: now,
      verification_code: 'IMP-DEMO2026EDU1',
      revoked_at: null,
      revoked_by: null,
      supervisor_name: 'Demo Organizer',
      supervisor_title: 'Event organizer',
    },
    {
      id: HOURS_VERIFIED_COMMUNITY,
      user_id: student.id,
      opportunity_id: EVENT_3,
      date: day(-60),
      hours: 4,
      description: 'Walked a senior through video calls and email settings.',
      verified: true,
      verified_by: organizer.id,
      verified_at: now,
      verification_code: 'IMP-DEMO2026COM1',
      revoked_at: null,
      revoked_by: null,
      supervisor_name: 'Demo Organizer',
      supervisor_title: 'Event organizer',
    },
    {
      id: HOURS_PENDING,
      user_id: student.id,
      opportunity_id: EVENT_2,
      date: day(-1),
      hours: 2,
      description: 'Helped two students with fractions and reading.',
      verified: false,
      verified_by: null,
      verified_at: null,
      verification_code: null,
      revoked_at: null,
      revoked_by: null,
      supervisor_name: null,
      supervisor_title: null,
    },
  ], { onConflict: 'id' })).error,
  'hours'
)

const { data: check, error: checkError } = await db
  .from('volunteer_hours')
  .select('id, verified, hours, verification_code')
  .in('id', [HOURS_VERIFIED, HOURS_VERIFIED_EDU, HOURS_VERIFIED_COMMUNITY, HOURS_PENDING])
fail(checkError, 'verify hours')

console.log(
  `Demo ready: ${studentEmail} (student) and ${organizerEmail} (organizer); ` +
  `${check?.filter((h) => h.verified).length ?? 0} verified / ` +
  `${check?.filter((h) => !h.verified).length ?? 0} pending hour log(s).`
)
