#!/usr/bin/env node
// Deterministic audit of the 100-language profile registry and implemented dictionaries.
// Profiles are metadata only; a locale is "usable" only when its dictionary passes review.
import { readFileSync, writeFileSync } from 'node:fs'

const root = new URL('..', import.meta.url)
const registry = JSON.parse(readFileSync(new URL('src/lib/language-profiles.json', root), 'utf8'))
const profiles = registry.profiles
const implemented = new Set(['en', 'es'])
const baseLocales = new Set(registry.baseLocales ?? [])
const errors = []
const warnings = []

const required = ['rank', 'code', 'bcp47', 'name', 'nativeName', 'script', 'direction', 'speakersM']
const seenCode = new Set()
const seenRank = new Set()

for (const profile of profiles) {
  for (const key of required) {
    if (profile[key] === undefined || profile[key] === null || profile[key] === '') {
      errors.push(`${profile.code ?? '?'}: missing ${key}`)
    }
  }
  if (seenCode.has(profile.code)) errors.push(`${profile.code}: duplicate code`)
  if (seenRank.has(profile.rank)) errors.push(`${profile.rank}: duplicate rank`)
  seenCode.add(profile.code)
  seenRank.add(profile.rank)
  if (!['ltr', 'rtl'].includes(profile.direction)) errors.push(`${profile.code}: invalid direction`)
  if (!implemented.has(profile.code)) {
    // Expected for the registry; reported as coverage, not a profile error.
  }
}

for (const profile of profiles) {
  if (profile.fallback !== null && !profiles.some((p) => p.code === profile.fallback) && !baseLocales.has(profile.fallback)) {
    errors.push(`${profile.code}: unknown fallback ${profile.fallback}`)
  }
}

const rtl = profiles.filter((p) => p.direction === 'rtl').map((p) => p.code)
const missing = profiles.filter((p) => !implemented.has(p.code))
const implementedProfiles = profiles.filter((p) => implemented.has(p.code))
const ranks = [...seenRank].sort((a, b) => a - b)
const rankGaps = []
for (let i = 1; i <= 100; i++) if (!seenRank.has(i)) rankGaps.push(i)

const report = `# Language profile audit

Generated: ${new Date().toISOString()}

- Profiles: ${profiles.length}
- Ranks 1–100: ${rankGaps.length === 0 ? 'complete' : `missing ${rankGaps.join(', ')}`}
- Implemented dictionaries: ${implementedProfiles.map((p) => `${p.code} (${p.nativeName})`).join(', ')}
- Missing dictionaries: ${missing.length} of ${profiles.length}
- Right-to-left profiles: ${rtl.length} (${rtl.join(', ')})
- Profile errors: ${errors.length}
- Warnings: ${warnings.length}

## Rules

A profile is metadata, not a translation claim. A locale is usable only when:

1. Every dictionary key exists and is non-empty.
2. Placeholders match the English source.
3. The layout sets \`lang\` and \`dir\` from the profile.
4. A native reviewer signs off on the translation.
5. The accessibility gate passes in that locale.

## Missing coverage

${missing.map((p) => `- ${p.rank}. ${p.name} (${p.code}, ${p.nativeName}) — fallback ${p.fallback ?? 'none'}`).join('\n')}

${errors.length ? `## Errors\n\n${errors.map((e) => `- ${e}`).join('\n')}` : '## Errors\n\nNone.'}

${warnings.length ? `## Warnings\n\n${warnings.map((w) => `- ${w}`).join('\n')}` : ''}
`

writeFileSync(new URL('LANGUAGE-AUDIT.md', root), report)
console.log(report)
process.exit(errors.length ? 1 : 0)
