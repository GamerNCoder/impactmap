import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'

let failures = 0

function check(condition, label, detail) {
  if (condition) {
    console.log(`PASS ${label}`)
  } else {
    failures += 1
    console.error(`FAIL ${label}${detail ? `: ${detail}` : ''}`)
  }
}

async function snapshot(page) {
  return page.evaluate(() => {
    const card = document.querySelector('.bg-white')
    const body = getComputedStyle(document.body)
    return {
      dark: document.documentElement.classList.contains('dark'),
      stored: localStorage.getItem('impactmap-theme'),
      bodyBg: body.backgroundColor,
      bodyColor: body.color,
      cardBg: card ? getComputedStyle(card).backgroundColor : null,
      toggle:
        document.querySelector('button[aria-label^="Switch to"]')?.getAttribute('aria-label') ??
        null,
    }
  })
}

async function run(scheme) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: scheme,
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'load' })
  await page.waitForTimeout(900)

  let state = await snapshot(page)
  console.log(scheme, 'initial', state)

  if (scheme === 'light') {
    check(!state.dark, 'light: initial html is light')
    check(state.bodyBg === 'rgb(249, 250, 251)', 'light: body background', state.bodyBg)
    check(state.cardBg === 'rgb(255, 255, 255)', 'light: card background', state.cardBg)
    check(
      state.toggle === 'Switch to dark mode',
      'light: toggle offers dark mode',
      state.toggle ?? 'missing'
    )

    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.waitForTimeout(400)
    state = await snapshot(page)
    console.log(scheme, 'after dark click', state)
    check(state.dark, 'light -> dark: html gets .dark')
    check(state.stored === 'dark', 'light -> dark: storage', state.stored ?? 'null')
    check(
      state.bodyBg === 'rgb(3, 7, 18)',
      'light -> dark: body background',
      state.bodyBg
    )
    check(
      state.cardBg === 'rgb(17, 24, 39)',
      'light -> dark: card background',
      state.cardBg
    )
    check(
      state.toggle === 'Switch to light mode',
      'light -> dark: toggle offers light mode',
      state.toggle ?? 'missing'
    )

    await page.goto(`${BASE}/opportunities`, { waitUntil: 'load' })
    const darkTile = await page.waitForSelector('img.leaflet-tile', { timeout: 12000 })
    const darkSrc = await darkTile.getAttribute('src')
    check(
      Boolean(darkSrc?.includes('openstreetmap.org')),
      'dark: map uses filtered OpenStreetMap tiles',
      darkSrc ?? 'no src'
    )

    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await page.waitForTimeout(900)
    const lightTile = await page.waitForSelector('img.leaflet-tile', { timeout: 12000 })
    const lightSrc = await lightTile.getAttribute('src')
    check(
      Boolean(lightSrc?.includes('openstreetmap.org')),
      'light: map restores OSM tiles',
      lightSrc ?? 'no src'
    )
  } else {
    check(state.dark, 'dark: initial html is dark')
    check(state.bodyBg === 'rgb(3, 7, 18)', 'dark: body background', state.bodyBg)
    check(state.cardBg === 'rgb(17, 24, 39)', 'dark: card background', state.cardBg)
    check(
      state.toggle === 'Switch to light mode',
      'dark: initial toggle offers light mode',
      state.toggle ?? 'missing'
    )

    await page.getByRole('button', { name: 'Switch to light mode' }).click()
    await page.waitForTimeout(400)
    state = await snapshot(page)
    console.log(scheme, 'after light click', state)
    check(!state.dark, 'dark -> light: html loses .dark')
    check(state.stored === 'light', 'dark -> light: storage', state.stored ?? 'null')
    check(
      state.bodyBg === 'rgb(249, 250, 251)',
      'dark -> light: body background',
      state.bodyBg
    )
    check(
      state.cardBg === 'rgb(255, 255, 255)',
      'dark -> light: card background',
      state.cardBg
    )
    check(
      state.toggle === 'Switch to dark mode',
      'dark -> light: toggle offers dark mode',
      state.toggle ?? 'missing'
    )

    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await page.waitForTimeout(400)
    state = await snapshot(page)
    check(state.dark, 'light -> dark again: html gets .dark')
    check(state.stored === 'dark', 'light -> dark again: storage', state.stored ?? 'null')
  }

  await context.close()
}

const browser = await chromium.launch()
await run('light')
await run('dark')
await browser.close()

if (failures) {
  console.error(`\n${failures} theme check(s) failed`)
  process.exit(1)
}
console.log('\nTHEME LOOP PASSED')
