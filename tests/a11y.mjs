// Accessibility gate: WCAG 2.1 A/AA rules via axe-core on the main public pages and both
// demo roles. Needs `npm run dev` (or BASE_URL pointing at a deployed site).
import { chromium } from 'playwright'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const axePath = require.resolve('axe-core/axe.min.js')
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

const browser = await chromium.launch()
let failures = 0

async function runAxe(page, label) {
  // Let the page's fade-in transitions finish; axe otherwise samples mid-animation opacity
  // and reports false color-contrast failures.
  await page.waitForTimeout(800)
  await page.addScriptTag({ path: axePath })
  const results = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    })
  })

  const blocking = results.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical'
  )

  if (blocking.length > 0) {
    failures += 1
    console.log(`FAIL  ${label}`)
    for (const violation of blocking) {
      console.log(`  [${violation.impact}] ${violation.id}: ${violation.help} (${violation.nodes.length} node(s))`)
      for (const node of violation.nodes.slice(0, 3)) {
        console.log(`    ${node.target.join(' ')}`)
      }
    }
  } else {
    console.log(`PASS  ${label}${results.violations.length ? ` (${results.violations.length} lower-impact)` : ''}`)
  }
}

const publicPaths = ['/', '/impact', '/demo', '/verify', '/verify/IMP-DEMO2026ABCD', '/opportunities', '/about', '/privacy', '/accessibility',
  '/trust',
  '/offline', '/terms', '/attributions', '/security', '/safety', '/pilot', '/pilot/guide']
const publicContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const publicPage = await publicContext.newPage()
for (const path of publicPaths) {
  await publicPage.goto(`${BASE}${path}`, { waitUntil: 'load' })
  await runAxe(publicPage, path)
}
await publicContext.close()

// The demo roles only exist where the demo accounts are seeded. On a bare CI database the
// /demo page says so, and we skip those two pages instead of failing on a missing login.
const demoProbe = await browser.newPage()
await demoProbe.goto(`${BASE}/demo`, { waitUntil: 'load' })
const demoConfigured = !(await demoProbe.locator('body').innerText()).includes('Demo not configured')
await demoProbe.close()

if (demoConfigured) {
  const studentContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const student = await studentContext.newPage()
  await student.goto(`${BASE}/demo/student`, { waitUntil: 'load' })
  await student.waitForURL(/\/dashboard/, { timeout: 15000 })
  await runAxe(student, '/dashboard (demo student)')
  await studentContext.close()

  const organizerContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const organizer = await organizerContext.newPage()
  await organizer.goto(`${BASE}/demo/organizer`, { waitUntil: 'load' })
  await organizer.waitForURL(/\/manage/, { timeout: 15000 })
  await runAxe(organizer, '/organizations/:id/manage (demo organizer)')
  await organizerContext.close()
} else {
  console.log('SKIP  demo roles (demo accounts are not configured)')
}

await browser.close()
console.log(failures ? `\n${failures} page(s) with serious/critical violations` : '\nAll accessibility checks passed')
process.exit(failures ? 1 : 0)
