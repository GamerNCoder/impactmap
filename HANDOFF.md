# ImpactMap: Congressional App Challenge handoff (updated 2026-10-12)

**Goal:** Win the Congressional App Challenge with ImpactMap. A website entry is allowed. The deadline is **Oct 26, 2026** (check the district page). AI use must be disclosed in the entry. The district is assumed to be NJ-6 (Rep. Frank Pallone, Edison NJ). The user still has to confirm it against their address.

**Pitch:** Students find local volunteer events on a map and check in by QR code. The organizer approves their hours with one tap. Each approval creates an IMP- code that a counselor can verify online, with no account and no paper forms.

**User's standing asks:** keep answers concise; commit and push verified work automatically; never print or mention secrets; run Docker and local models on CLEAN, never the Mac; automate everything (only account, payment and trust steps go to the user); keep the app simple so users aren't overloaded; keep the site presentation-ready.

## LIVE: https://impactmap.vercel.app
- It runs commit `e0638d2` on branch `cac/core-loop`, pushed to GitHub and deployed to production on 2026-10-15.
- Supabase project `impactmap-cac` (ref zolvpddzpimegnkimszh). Deploy state lives in `.env.deploy.local` (gitignored; don't print it). The old paused `impactmap` project still exists and is unused.
- All migrations are applied to production, including the 2026-10-12 pair.
- To redeploy, run `./deploy.sh`. It is idempotent and does these steps:
  1. Pushes the migrations.
  2. Sets the Vercel env with `vercel@latest env add --force --no-sensitive --yes`.
  3. Deploys to production.
  4. Turns off email confirmation (free-tier email is rate-limited).
- The auto-mode classifier blocks production DB queries and deploys unless the user approves them in chat. The user approved deploys on 2026-10-11 ("deploy approved").
- Last check (2026-10-12) was read-only:
  - All pages return 200. `/passport/report` returns 307 to login when signed out, which is expected.
  - Map tiles load and the Edison pins appear.
- The full UI test was NOT rerun against production after the 2026-10-12 changes, to avoid creating more test data there. It did pass on production before those changes.

## 2026-10-15 cleanup pass (done)
- **Cut the uncut SaaS layer.** Deleted the plan tiers, org API keys, webhooks, org settings, ESG export, platform admin page and its `/api/admin/*` routes, the unused reverse-geocode route, and the dead `ai-context` / `commitment-*` / `competency-data` / `skills` / `plan-tiers` / `org-plan-data` / `org-api` / `platform-admin` libs (19 files).
  - The free "starter" plan had been blocking things: creating a second organization threw "Upgrade to create more", and approving *any* coordinator request failed with "Coordinator seat limit reached". Both gates are gone.
- **Removed the dollar "impact value"** from `/verify/[code]` and from the coordinator CSV — it was supposed to be cut in the 2026-10-12 simplification.
- **Design coherence.** The event detail, post-event, organization, and join/log/approve components were still on the old indigo/violet palette; all now use the emerald system with dark-mode variants.
- **Wrong verification codes** now get a dedicated page (`/verify/[code]/not-found.tsx`) with a retry link instead of the generic 404.
- **Bug fixes:** duplicate DOM ids in `LogHoursForm` (one form per joined event) are now prefixed by opportunity id; `VerifyLookupClient` accepts a pasted `…/verify/IMP-…` URL; camera-permission errors are plain English; the landing page's dark-hero labels meet AA contrast; the org page's "Approve hours" link only shows to people who can actually manage the org.
- **Legal pages** no longer claim phone numbers, government ID images, SkillMatch, or enterprise DPAs — they now match what the app actually collects.
- **New `app/error.tsx`** so a database hiccup shows a real error instead of a misleading "no events yet".
- Verified: `npx tsc --noEmit`, `eslint`, and `npm run build` all clean (23 routes).

### Production data (decided 2026-10-15)
Production carries the **5 sample events** at real Edison public places, so the map is never empty for a judge who clicks the link before watching the video. They are demo listings, and the misleading parts were removed:
- the 4 sample organizations are **no longer marked `verified`** (they had been falsely showing a "✓ Verified organizer" badge)
- their `example.org` website/email were cleared, so no placeholder contact shows on public org pages
- `volunteers_count` was zeroed (it had fabricated "12 joined / 40 spots" with no real users on the platform)

This was applied to production, and `supabase/seed.sql` now matches it. **`deploy.sh` no longer pushes the seed** — it ran `db push --include-seed`, which would have resurrected the fabricated rows on every future deploy. `seed.sql` is local-dev only now.

### Known limitation (affects the demo)
The 5 sample events belong to organizations with **no owner or coordinator**, so a student can join them and log hours but nobody can ever approve. For the approval step, the organizer must **post the event from their own account**. The demo script in `SUBMISSION.md` was updated accordingly.

With the platform-admin verify route deleted, `organizations.verified` is now an operator-set flag (set it via SQL or the Supabase dashboard). A real pilot organization should be marked verified that way so the trust badge stays genuine.

## Blocking before judging (needs the user or their permission)

1. ~~**Delete the production test data**~~ — **done 2026-10-15.** Removed the "Austin Park Friends" org, the "Saturday park cleanup" event, the 2 `@example.com` accounts, and 1 orphan verified hour. Production now holds no real users, only the honest sample events above.
2. **Demo video** (judged). Script in `SUBMISSION.md`: student signs up → map → organizer posts an event → student joins → logs hours → organizer taps Approve → counselor opens /verify/IMP-… → printable counselor report.
3. **AI-use disclosure** in the entry form.
4. **Real pilot** (strongest win factor): one real group (NHS, Key Club, a library) using it, with a quote or numbers.
5. **Guardian consent** is an attestation checkbox, not a verified email to the parent. That's a possible upgrade if asked.

## Run locally (Docker on CLEAN only)
- `scripts/clean-db.sh up`: rsyncs `supabase/` to `CLEAN:~/impactmap-db/`, runs `npx supabase@2.120.0 start` there, and SSH-tunnels ports 54321-54324 to the Mac's localhost.
- Other subcommands: `scripts/clean-db.sh reset` (migrations + seed), `scripts/clean-db.sh tunnel`, `scripts/clean-db.sh stop`.
- Run the script with `</dev/null`. If `start` hangs while the containers are healthy, kill it.
- `/scripts` and `/tests` are gitignored. The tests were already tracked; `clean-db.sh` was force-added.
- Then run `npm run dev` and open http://localhost:3000. Mac Docker should stay quit.
- Current state: the CLEAN DB is up and the tunnel is active; the Mac dev server is stopped.

## Tests (all passing 2026-10-12)
- `npm run test:db`: 26 database and security checks (`tests/e2e-core-loop.mjs`). They include "peers can't read email or birthday", `my_profile()` and setting a goal.
- `npm run test:ui`: Playwright walkthrough at phone size (`tests/ui-core-loop.mjs`); set `BASE_URL` to test a live site. It covers:
  1. Signup, with the guardian path for a student born 2011-06-01.
  2. Map pins.
  3. The coordinator posts an event at "340 Plainfield Ave, Edison, NJ".
  4. The student joins and logs hours.
  5. The coordinator taps "Approve 3h".
  6. The 40h goal and the report QR.
  7. A signed-out counselor verifies the code.
- Also clean: `npx tsc --noEmit`, eslint and `npm run build`.

## Stack and rules
- Next.js 16.2.9 App Router, React 19, Tailwind v4, TypeScript, Supabase (RLS).
- **AGENTS.md says to read `node_modules/next/dist/docs/` before writing Next code**, because the APIs differ from what models were trained on.
- Map: Leaflet 1.9.4 with OpenStreetMap tiles, imported dynamically in a client component. Geocoding uses Nominatim through `/api/geocode/search`.
- QR codes: the `qrcode` package (server-side data URLs).

## What exists (commits 11f192e, 7342237, 3d713e0)

**Schema and data**
- `supabase/migrations/20261011000000_schema.sql`: base schema. RLS means students can't verify their own hours and nobody can take over an org they didn't create.
- `supabase/migrations/20261012000000_map_goals_safety.sql`:
  - New columns: `opportunities.latitude/longitude`, plus `profiles.hours_goal`, `guardian_name`, `guardian_email` and `guardian_consent_at`.
  - Privacy: `REVOKE SELECT ON profiles FROM authenticated`, then a column GRANT of the public fields only.
  - `my_profile()` is a SECURITY DEFINER RPC for the user's own private fields. anon can read `hours_goal`.
- `supabase/migrations/20261012000100_demo_event_coordinates.sql`: adds coordinates to the seed events on databases where the seed had already run (production).
- `supabase/seed.sql`: 5 Edison demo events: Papaianni Park, Edison Public Library Main, Roosevelt Park, Dismal Swamp, and one virtual. Organizers are fictional, with example.org contacts; the places are real.

**Pages**
- `/` (`src/app/page.tsx`): hero, counselor-view example, stats, 4-step How it works, Coming up, cards for students/organizers/counselors, safety link.
- `/opportunities` (`page.tsx` + `src/components/EventsExplorer.tsx`): map and "📍 Near me" distance sort, plus search and category filters. Search input is sanitized for PostgREST.
- `/opportunities/new` (`CreateEventForm.tsx`): geocodes the address before insert.
- `/opportunities/[id]`: event detail with a "✓ Verified organizer" label.
- `/dashboard` ("Home"): verified and pending hours, `HoursGoal`, Log hours, and Events you're hosting → "Approve hours".
- `/passport` ("My hours"):
  - verified total, goal, verified entries with codes, pending entries
  - share button
  - link to `/passport/report`, which is printable/PDF, has a QR per entry and a counselor note, and fits phone width
- Data for these comes from `src/lib/service-record.ts` (`getServiceRecord`).
- `/organizations/[id]/manage` ("Approve hours"): `VerifyHoursForm` gives one-tap approval signed as the logged-in organizer; the role field is editable. There's also a CSV export, which has no student emails.
- `/auth/signup`: name, email, password, birthday, terms. Ages 13-15 also need a guardian name and email (which can't match the student's) and a consent checkbox. Under 13 is blocked.
- `/safety` (six rules), `/verify` and `/verify/[code]` (public), `/volunteers/[id]` (public verified hours).
- `/profile`: name, read-only email and guardian info, via `my_profile()`.
- `/onboarding` redirects to `/dashboard`; `/matches` redirects to `/opportunities`.
- Navigation: signed in shows Events / Home / My hours / Host an event; guests see Events / Check a code / Safety.

**Removed in the 2026-10-12 simplification (29 files):** onboarding wizard, skill matching, AI features, commitment score, star reviews, achievement badges, "impact value", ID-document upload, phone number field.

## Ideas if more time remains
- Send the guardian a real consent email (would need an email provider).
- Remove pending test events automatically, or hide anything from the example.com domain.
- Lighthouse/accessibility pass; Spanish translation of the landing page.
- Use pilot numbers on the landing page in place of the example card.
