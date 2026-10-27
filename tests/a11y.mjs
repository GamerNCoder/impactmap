// Accessibility gate: WCAG 2.2 A/AA rules via axe-core on the main public pages and both
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
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
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

const publicPaths = ['/', '/impact', '/demo', '/verify', '/verify/IMP-DEMO2026ABCD', '/opportunities', '/organizations', '/about', '/privacy', '/accessibility',
  '/trust', '/auth/login', '/auth/signup',
  '/offline', '/terms', '/attributions', '/security', '/safety', '/pilot', '/pilot/guide']

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const width = doc.clientWidth
    const over = Math.max(doc.scrollWidth, document.body.scrollWidth) - width
    let worst = null
    if (over > 1) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.right > width + 1 && (!worst || rect.right > worst.right)) {
          worst = {
            tag: el.tagName.toLowerCase(),
            cls: String(el.className).slice(0, 60),
            right: Math.round(rect.right),
            text: (el.textContent ?? '').trim().slice(0, 40),
          }
        }
      }
    }
    return { width, over, worst }
  })
}

// WCAG 1.4.10 reflow: no horizontal page scrolling at 320 px, and no horizontal scrolling when
// text is doubled at a desktop width (the same condition the A+ control creates).
async function reflowPass(label, viewport, rootFontPx) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  let bad = 0
  for (const path of publicPaths) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' })
    if (rootFontPx) await page.addStyleTag({ content: `html{font-size:${rootFontPx}px !important}` })
    await page.waitForTimeout(300)
    const { width, over, worst } = await measureOverflow(page)
    if (over > 1) {
      bad += 1
      const detail = worst ? ` — ${worst.tag}.${worst.cls} right=${worst.right} "${worst.text}"` : ''
      console.log(`FAIL  reflow ${label} ${path}: ${over}px wider than ${width}px${detail}`)
    }
  }
  if (bad === 0) console.log(`PASS  reflow ${label} (${publicPaths.length} pages)`)
  else failures += 1
  await context.close()
}

const publicContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const publicPage = await publicContext.newPage()
for (const path of publicPaths) {
  await publicPage.goto(`${BASE}${path}`, { waitUntil: 'load' })
  await runAxe(publicPage, path)
}

// The text-size control must be reachable, enlarge the root font, persist across a reload, and
// return to the default.
await publicPage.goto(`${BASE}/`, { waitUntil: 'load' })
const sizeOf = () => publicPage.evaluate(() => getComputedStyle(document.documentElement).fontSize)
const baseSize = await sizeOf()
await publicPage.getByRole('button', { name: 'Increase text size' }).first().click()
const grownSize = await sizeOf()
await publicPage.reload({ waitUntil: 'load' })
const persistedSize = await sizeOf()
await publicPage.getByRole('button', { name: 'Decrease text size' }).first().click()
const restoredSize = await sizeOf()
if (
  parseFloat(grownSize) > parseFloat(baseSize) &&
  persistedSize === grownSize &&
  restoredSize === baseSize
) {
  console.log(`PASS  text size control (${baseSize} -> ${grownSize}, remembered)`)
} else {
  failures += 1
  console.log(`FAIL  text size control (base ${baseSize}, grown ${grownSize}, persisted ${persistedSize}, restored ${restoredSize})`)
}
await publicContext.close()

await reflowPass('320px', { width: 320, height: 800 })
await reflowPass('200% text', { width: 1280, height: 900 }, 32)

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
