#!/usr/bin/env node
// Detection layer for the defense-in-depth policy. Fails if the primary controls in
// 20261024000000_defense_in_depth.sql disappear or are bypassed.
//
// Usage:
//   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_ANON_KEY=... npm run audit:defenses
//   BASE_URL=https://impactmap.vercel.app ...  (adds live header checks)
import { writeFileSync } from 'node:fs'

const url = process.env.SUPABASE_URL
const anon = process.env.SUPABASE_ANON_KEY
const base = process.env.BASE_URL
if (!url || !anon) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY')
  process.exit(2)
}

const checks = []
const record = (name, pass, detail) => {
  checks.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function get(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, Accept: 'application/json' },
  })
  const text = await res.text()
  let body = null
  try { body = JSON.parse(text) } catch {}
  return { status: res.status, body, text }
}

const members = await get('organization_members?select=*&limit=1')
record('anon cannot read organization_members',
  members.status === 401 || members.status === 403 || (Array.isArray(members.body) && members.body.length === 0),
  `${members.status} ${members.text.slice(0, 100)}`)

const audit = await get('security_audit_log?select=*&limit=1')
record('anon cannot read security_audit_log',
  audit.status === 401 || audit.status === 403 || (Array.isArray(audit.body) && audit.body.length === 0),
  `${audit.status} ${audit.text.slice(0, 100)}`)

const hours = await get('volunteer_hours?select=*&limit=1')
record('anon cannot enumerate volunteer_hours',
  hours.status === 401 || hours.status === 403 || (Array.isArray(hours.body) && hours.body.length === 0),
  `${hours.status} ${hours.text.slice(0, 100)}`)

const profiles = await get('profiles?select=id,email&limit=1')
record('anon cannot read profile email',
  profiles.status === 401 || profiles.status === 403,
  `${profiles.status} ${profiles.text.slice(0, 100)}`)

const privateFields = await get('profiles?select=bio,location,skills,volunteer_availability&limit=1')
record('anon cannot read private profile fields',
  privateFields.status === 401 || privateFields.status === 403,
  `${privateFields.status} ${privateFields.text.slice(0, 100)}`)

const impact = await fetch(`${url}/rest/v1/rpc/impact_summary`, {
  method: 'POST',
  headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
  body: '{}',
})
const impactText = await impact.text()
record('anon can read the k-anonymous impact summary',
  impact.status === 200,
  `${impact.status} ${impactText.slice(0, 100)}`)

for (const fn of ['revoke_hours', 'restore_hours']) {
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_hours_id: '00000000-0000-0000-0000-000000000000' }),
  })
  const text = await res.text()
  record(`anon cannot call ${fn}`, [401, 403, 404].includes(res.status), `${res.status} ${text.slice(0, 100)}`)
}

const orgs = await get('organizations?select=id,name&limit=1')
record('anon can read public organization name (backup grant present)',
  orgs.status === 200,
  `${orgs.status} ${orgs.text.slice(0, 100)}`)

if (base) {
  const res = await fetch(`${base}/`)
  const csp = res.headers.get('content-security-policy') ?? ''
  record('frame-ancestors none', csp.includes("frame-ancestors 'none'"), csp)
  record('x-frame-options DENY', res.headers.get('x-frame-options') === 'DENY', res.headers.get('x-frame-options') ?? '')
  record('no unsafe-eval in CSP (hardening target)', !csp.includes("'unsafe-eval'"), csp.includes("'unsafe-eval'") ? 'present' : 'absent')
  const reset = await fetch(`${base}/api/demo/reset`, { method: 'POST' })
  record('demo reset rejects cross-site/no-origin', reset.status === 403 || reset.status === 503, String(reset.status))
}

const failed = checks.filter((c) => !c.pass)
const report = `# Defense audit\n\nTarget: ${url}${base ? ` (site: ${base})` : ''}\nGenerated: ${new Date().toISOString()}\n\n${checks.map((c) => `- ${c.pass ? 'PASS' : 'FAIL'} ${c.name} — ${c.detail}`).join('\n')}\n\n${failed.length ? `${failed.length} failed` : 'All checks passed'}\n`
writeFileSync('DEFENSE-AUDIT.md', report)
process.exit(failed.length ? 1 : 0)
