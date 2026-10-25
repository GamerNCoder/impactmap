## What changed

<!-- One or two sentences. Link the issue if there is one. -->

## Verification

- [ ] `npx tsc --noEmit`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:db` (local Supabase)
- [ ] `npm run audit:defenses` (URL, anon key, and `BASE_URL` for headers)
- [ ] `npm run test:a11y`, `test:ui`, `test:theme` (app running)

Paste the commands you ran and their result. If a check does not apply, say why.

## Invariants

- [ ] No self-approval path was added; an unverified organizer is still labeled.
- [ ] Check-in is still described as a signal, not proof; coordinates are not stored.
- [ ] Public impact is still k-anonymous (3 distinct volunteers, 5 student total).
- [ ] No new claim of full offline, full translation, or a pilot that did not happen.
- [ ] Schema changes are a new migration; types were regenerated.
