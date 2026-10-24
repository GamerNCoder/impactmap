// Browser walkthrough of the full loop (phone viewport). Needs `npm run dev` + local Supabase.
// Run: npm run test:ui
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const run = Date.now()
const shots = process.env.SHOTS_DIR ?? 'test-results'
mkdirSync(shots, { recursive: true })
const browser = await chromium.launch()
const log = (...a) => console.log('•', ...a)

function readLocalEnv() {
  try {
    return Object.fromEntries(
      readFileSync('.env.local', 'utf8')
        .split('\n')
        .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
        .map((line) => {
          const at = line.indexOf('=')
          return [line.slice(0, at), line.slice(at + 1).trim().replace(/^["']|["']$/g, '')]
        })
    )
  } catch {
    return {}
  }
}

async function fail(page, name, err) {
  await page.screenshot({ path: `${shots}/fail-${name}.png`, fullPage: true })
  console.log(`FAIL at ${name}: ${err.message.split('\n')[0]}\nURL: ${page.url()}\n--- page text ---\n${(await page.innerText('body')).slice(0, 1500)}`)
  await browser.close(); process.exit(1)
}
async function step(page, name, fn) { try { await fn(); log(name, '✓') } catch (e) { await fail(page, name, e) } }

async function signup(label, dob = '2009-05-01') {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }) // phone-size
  const page = await ctx.newPage()
  page.on('pageerror', e => console.log(`  [${label} page error] ${e.message.split('\\n')[0]}`))
  await step(page, `${label}: sign up`, async () => {
    await page.goto(`${BASE}/auth/signup`)
    await page.fill('#fullName', `Test ${label}`)
    await page.fill('#email', `${label}-${run}@example.com`)
    await page.fill('#password', 'test-password-123')
    await page.fill('#dob', dob)
    if (await page.locator('#guardianName').isVisible()) {
      await page.fill('#guardianName', 'Pat Parent')
      await page.fill('#guardianEmail', `parent-${run}@example.com`)
      await page.locator('#guardianConsent').check()
    }
    await page.locator('#signup-terms').check()
    await page.locator('button[type=submit]').click()
    await page.waitForURL(/opportunities/, { timeout: 15000 })
  })
  return page
}

const coord = await signup('coordinator')
await step(coord, 'health endpoint', async () => {
  const res = await fetch(`${BASE}/api/health`)
  const json = await res.json()
  if (!res.ok || !json.ok || json.database !== 'ok') {
    throw new Error(`HTTP ${res.status} ${JSON.stringify(json)}`)
  }
})
let eventUrl
await step(coord, 'coordinator: create org + event', async () => {
  await coord.goto(`${BASE}/opportunities/new`)
  const orgName = coord.getByPlaceholder('Organization or group name')
  if (await orgName.isVisible()) await orgName.fill(`Test Org ${run}`)
  await coord.fill('#title', 'Saturday park cleanup')
  await coord.fill('#description', 'Pick up litter and plant native flowers along the creek trail.')
  await coord.selectOption('#category', 'Environment')
  await coord.fill('#startDate', '2026-10-17')
  await coord.fill('#location', '340 Plainfield Ave, Edison, NJ')
  await coord.fill('#capacity', '10')
  await coord.fill('#timeCommitment', '3 hours')
  await coord.locator('button[type=submit]').click()
  await coord.waitForURL(/opportunities\/[0-9a-f-]{36}/, { timeout: 15000 })
  eventUrl = coord.url()
})
await coord.screenshot({ path: `${shots}/01-event-coordinator.png`, fullPage: true })

const student = await signup('student', '2011-06-01') // 15: guardian consent path
await step(student, 'student: map shows event pins', async () => {
  await student.goto(`${BASE}/opportunities`)
  await student.locator('.leaflet-container').waitFor({ timeout: 15000 })
  const pins = await student.locator('path.leaflet-interactive').count()
  if (pins < 1) throw new Error(`expected map pins, got ${pins}`)
})
await student.screenshot({ path: `${shots}/00-map.png`, fullPage: true })
await step(student, 'student: join via check-in link', async () => {
  await student.goto(eventUrl)
  await student.getByRole('button', { name: /join/i }).first().click()
  await student.getByText(/leave|you.?re (going|in|signed)|joined/i).first().waitFor({ timeout: 10000 })
})
await step(student, 'student: log hours', async () => {
  await student.goto(`${BASE}/dashboard`)
  await student.getByPlaceholder('2.5').first().fill('3')
  await student.getByPlaceholder('What did you work on?').first().fill('Collected 4 bags of litter')
  await student.getByRole('button', { name: 'Log hours' }).first().click()
  await student.getByText(/Pending organizer approval/).first().waitFor({ timeout: 10000 })
})
await student.screenshot({ path: `${shots}/02-student-logged.png`, fullPage: true })

let code
await step(coord, 'coordinator: approve hours', async () => {
  const orgLink = await coord.locator('a[href*="/organizations/"][href$="/manage"]').first().getAttribute('href')
    .catch(() => null)
  if (orgLink) await coord.goto(BASE + orgLink)
  else {
    const org = await coord.locator('a[href^="/organizations/"]').first().getAttribute('href')
    await coord.goto(`${BASE}${org}/manage`)
  }
  await coord.screenshot({ path: `${shots}/03-manage.png`, fullPage: true })
  await coord.getByRole('button', { name: /^Approve 3h$/ }).first().click()
  const el = coord.getByText(/IMP-[A-F0-9]{8,}/).first()
  await el.waitFor({ timeout: 10000 })
  code = (await el.innerText()).match(/IMP-[A-F0-9]+/)[0]
})
log('code', code)

await step(student, 'student: passport shows code', async () => {
  await student.goto(`${BASE}/passport`)
  await student.getByText(code).first().waitFor({ timeout: 10000 })
})
await step(student, 'student: sets goal and opens counselor report', async () => {
  await student.getByRole('button', { name: '40h' }).click()
  await student.getByText('3.0 of 40 hours').first().waitFor({ timeout: 10000 })
  await student.goto(`${BASE}/passport/report`)
  await student.getByText(code).first().waitFor({ timeout: 10000 })
  await student.locator(`img[alt="QR code to verify ${code}"]`).waitFor({ timeout: 5000 })
})
await student.screenshot({ path: `${shots}/06-report.png`, fullPage: true })
await student.screenshot({ path: `${shots}/04-passport.png`, fullPage: true })

const anonCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const counselor = await anonCtx.newPage()
await step(counselor, 'counselor (signed out): verify code', async () => {
  await counselor.goto(`${BASE}/verify`)
  await counselor.getByPlaceholder('IMP-A4F92B1C2D3E').fill(code)
  // The field is a textarea (it also accepts a pasted list), so Enter inserts a newline
  // rather than submitting — use the button.
  await counselor.getByRole('button', { name: /Look up credential/ }).click()
  await counselor.waitForURL(new RegExp(code), { timeout: 10000 })
  await counselor.getByText('Test s.').first().waitFor({ timeout: 10000 })
  await counselor.getByText('Hours verified').waitFor({ timeout: 5000 })
})
await step(counselor, 'counselor (signed out): bulk verify endpoint', async () => {
  const res = await fetch(`${BASE}/api/verify/bulk`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ codes: [code, 'IMP-000000000000', 'not-a-code'] }),
  })
  if (!res.ok) throw new Error(`bulk returned HTTP ${res.status}`)
  const json = await res.json()
  if (json.summary?.checked !== 3) throw new Error(`checked=${json.summary?.checked}`)
  if (json.summary?.verified !== 1) throw new Error(`verified=${json.summary?.verified}`)
  const verified = json.results?.find((r) => r.code === code)
  if (verified?.status !== 'verified' || verified?.name !== 'Test student') throw new Error(JSON.stringify(verified))
  if (!json.results?.some((r) => r.status === 'invalid')) throw new Error('expected an invalid row')
})
await counselor.screenshot({ path: `${shots}/05-verify.png`, fullPage: true })

// A session created outside the sign-up form (the OAuth shape: no terms, no birthday)
// must be forced through both gates before a protected page opens.
const local = readLocalEnv()
const gateUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? local.NEXT_PUBLIC_SUPABASE_URL
const gateKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? local.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (/localhost|127\.0\.0\.1/.test(BASE) && gateUrl && gateKey) {
  const gateEmail = `gate-${run}@example.com`
  const gateSignup = createClient(gateUrl, gateKey, { auth: { persistSession: false } })
  const { error: gateSignupErr } = await gateSignup.auth.signUp({
    email: gateEmail,
    password: 'test-password-123',
  })
  if (gateSignupErr) {
    console.log(`FAIL at gate signup: ${gateSignupErr.message}`)
    await browser.close()
    process.exit(1)
  }
  const gateCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const gate = await gateCtx.newPage()
  await step(gate, 'gate: login without terms/birthday', async () => {
    await gate.goto(`${BASE}/auth/login`)
    await gate.fill('#email', gateEmail)
    await gate.fill('#password', 'test-password-123')
    await gate.locator('#login-terms').check()
    await gate.getByRole('button', { name: 'Sign in', exact: true }).click()
    await gate.waitForURL(
      (url) =>
        url.pathname === '/dashboard' ||
        url.pathname === '/auth/accept-terms' ||
        url.pathname === '/auth/complete-profile',
      { timeout: 15000 }
    )
    if (new URL(gate.url()).pathname === '/auth/accept-terms') {
      await gate.locator('#terms').check()
      await gate.getByRole('button', { name: /Continue to ImpactMap/ }).click()
    }
    if (new URL(gate.url()).pathname !== '/auth/complete-profile') {
      await gate.goto(`${BASE}/dashboard`)
    }
    await gate.waitForURL((url) => url.pathname === '/auth/complete-profile', { timeout: 15000 })
  })
  await step(gate, 'gate: birthday opens the dashboard', async () => {
    await gate.fill('#dob', '2009-05-01')
    if (await gate.locator('#guardianName').isVisible()) {
      await gate.fill('#guardianName', 'Pat Parent')
      await gate.fill('#guardianEmail', `parent-gate-${run}@example.com`)
      await gate.locator('#guardianConsent').check()
    }
    await gate.getByRole('button', { name: /^Continue$/ }).click()
    await gate.waitForURL((url) => url.pathname === '/dashboard', { timeout: 15000 })
  })
  await gateCtx.close()
}
console.log('\nUI LOOP PASSED')
await browser.close()
