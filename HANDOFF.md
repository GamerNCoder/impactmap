---
handoff-index: false
product: impactmap
repo: /Users/togi/Projects/impactmap
signatures: impactmap, congressional app challenge, cac, volunteer hours, vercel, supabase, demo, pilot, nj-6, event check-in
updated: 2026-10-24T18:17-04:00
---
# ImpactMap — handoff (2026-10-24)

Current repo facts, 2026-10-24: branch `cac/core-loop`, clean tree (see `git log` for the tip);
all 2026-10-21/22 work and the break-report fixes are committed and pushed to the public repo
(`github.com/heyitsmeyourbudlol-lgtm/impactmap`). Live: https://impactmap.vercel.app.

Earlier detail is in git history (`git log -p HANDOFF.md`).

## 2026-10-24 — CI unblocked + least-privilege restore
- **CI root cause:** the `database-and-accessibility` job pinned Node 20; `@supabase/supabase-js`
  now throws "Node.js 20 detected without native WebSocket support" when the client is created,
  so the DB suite died before its first check (`verify`: tsc/lint/build was already green). Both
  CI jobs now run Node 22.
- **Fresh-reset regression:** `20261024000000_defense_in_depth.sql` granted table-wide SELECT on
  `profiles` and `organizations` to `authenticated` (any signed-in adult could read every
  student's email, birthday, location, bio and availability), re-exposed `bio` to `anon`, and its
  blanket function revoke left `impact_summary()` without EXECUTE, so `/impact` failed for anon.
  `20261024000600_restore_least_privilege_grants.sql` rebuilds the exact column sets, keeps
  writes table-level under RLS, and makes `impact_summary()` `SECURITY DEFINER` with a pinned
  `search_path` (anon still has no `volunteer_hours` grant).
- **Tests:** the self-admin check now reads `is_platform_admin()` because the column is no longer
  selectable; `audit:defenses` fails if anon reads bio/location/skills/availability or if the
  impact RPC stops answering; the unused `hasAcceptedTerms()` (which selected the revoked terms
  columns) was deleted.
- **Verified locally on Node 22:** `test:db` **86/86** on a freshly reset database (run
  `scripts/clean-db.sh reset` first), `test:a11y` 10/10, `test:ui` full loop, `test:theme`,
  `tsc`, `eslint` and `next build` clean. A reset wipes the demo users — rerun
  `npm run seed:demo` before the browser tests.
- **Audit integrity:** `20261024000700_audit_rows_must_be_attributed.sql` requires
  `user_id = auth.uid()` on client audit inserts; unattributed rows are rejected (three new e2e
  checks). Trigger and account-deletion writes run as the table owner.
- **Gotcha:** `REVOKE SELECT ON <table>` also clears that table's column ACLs; table and column
  grants are separate ACLs, so a least-privilege migration must rebuild the column set.
- **Production audit caught a second regression:** `POST /api/demo/reset` returned 200 with no
  `Origin` header — the guard was `if (origin)`, so a missing header skipped the check. The route
  now fails closed: no origin → 403, cross-site → 403, same-origin → 307. Live after deploy: anon
  `profiles?select=bio|email` and `organization_members` → 401; `impact_summary` → 200 (36 h, 12
  records, 10 students); `/`, `/impact`, `/demo`, `/verify/IMP-DEMO2026ABCD`, `/trust`, `/offline`,
  `/robots.txt`, `/sitemap.xml` all 200; a11y 10/10 against production. `DEFENSE-AUDIT.md` holds the
  2026-10-24 production evidence (11/11, all pass).

## State
- **Live:** https://impactmap.vercel.app · branch `cac/core-loop` · deployed **2026-10-24** via
  `./deploy.sh`; the working tree is committed and pushed, and GitHub CI is green.
- Supabase project `impactmap-cac` (ref `zolvpddzpimegnkimszh`). Migrations through
  `20261024000600_restore_least_privilege_grants.sql` are applied to production.
  Redeploy: `./deploy.sh`.
- **Demo is live:** https://impactmap.vercel.app/demo (student/organizer one-click; 9 verified
  demo hours + 1 pending log; code `IMP-DEMO2026ABCD`). Demo env vars are on Vercel and in
  `.env.deploy.local`; `deploy.sh` reseeds after each deploy.
- `.env.local` points at the LOCAL Supabase (`127.0.0.1:54321`); local dev needs the CLEAN
  tunnel: `scripts/clean-db.sh up` (tunnel is its own ssh; `clean-db.sh tunnel` re-establishes it).

## 2026-10-22 — theme toggle + dark map fix
- **Root cause:** `ThemeProvider` computed `resolvedTheme` with the server snapshot (`light`) while
  the theme was `system`. On an OS-dark first visit the inline script made the page dark, but the
  toggle rendered the light-mode label; the first click did the opposite of what it said. The
  Leaflet tiles were always OSM light, so the map stayed bright in dark mode.
- **Fix:** `resolvedTheme` is a `useSyncExternalStore` with a light server snapshot and a
  client snapshot from the stored/system theme; a hydration-safe mounted check gates the class
  apply. Invalid stored values fall back to `system`. `EventsExplorer` and `ImpactMapView` choose
  OSM light vs CARTO `dark_all` tiles and re-initialise on theme change; `/attributions` credits
  CARTO for the dark tiles.
- **Regression test:** `npm run test:theme` (`tests/theme.mjs`) runs both OS schemes and both toggle
  directions, checks class/storage/body/card colors, and asserts the CARTO dark and OSM light tile
  URLs. It is wired into the CI database job after the UI walkthrough.
- **Verified:** `tsc`, `eslint`, `next build` clean; theme test 26/26 checks; UI loop 15 steps;
  a11y 10/10 pages. Deployed 2026-10-22 via `./deploy.sh`.

## 2026-10-22 — engineering finish (typed clients, health, CI UI)
- **Type safety:** `src/lib/supabase/{server,client}.ts` now use the generated `Database` type;
  `src/types/database.ts` was regenerated from the current local schema (includes
  `event_checkins.distance_m`/`outside_window`, `pilot_requests`, current RPCs). Removed the
  `as never` RPC casts and fixed generated-type nullability in the export, manage, opportunity,
  organization, audit and analytics paths.
- **Health:** `GET /api/health` is a public liveness + database check (`ok/service/database/
  latency_ms`, `503` on failure); the UI walkthrough now hits it.
- **CI:** the database/accessibility job now also runs the **UI walkthrough** after the a11y gate.
- **Verified:** `tsc --noEmit`, `eslint`, `next build` clean; `test:db` **77/77**; `test:ui`
  **15 steps** (health + full loop + bulk + terms/birthday gate); `test:a11y` **10/10** pages;
  local `/api/health` = `{ok:true,database:"ok",latency_ms:10}`. **Live:** `/api/health` HTTP 200,
  `/`, `/demo`, `/impact`, `/pilot`, `/pilot/guide`, `/verify/IMP-DEMO2026ABCD` all 200; live
  a11y 10/10. Deployed 2026-10-22 via `./deploy.sh` (demo reseeded).
- **Remaining:** user-only demo video, AI-use disclosure, district confirmation and a real pilot
  (the validation blocker); OAuth provider credentials; public repo; commit/push; CI has not run
  on GitHub yet. Optional non-blocking stretch: performance budget, DB-backed rate limiting,
  CSP nonce, a manual screen-reader pass.

## 2026-10-21 — audit cleanup shipped to production
- **Security:** `20261021000000_revoke_dead_tables.sql` applied to production — the 11 retired
  SaaS tables (all 0 rows) lost every `anon`/`authenticated` grant and their permissive policies.
  Verified on prod: no grants remain. Reversible (revoke, not drop).
- **README now matches reality:** `supabase/migrations/` is the schema source of truth (the stale
  `supabase/schema.sql` was removed), OAuth is Google/Apple/Microsoft only, the old paused project
  ref is gone, and the tests/structure sections were refreshed. `CHANGELOG.md` added.
- **Types regenerated** from the live schema (`event_checkins` added, five phantom tables gone).
  **`src/middleware.ts` → `src/proxy.ts`** (Next 16 convention; build warning gone).
  `supabase/config.toml` local redirect is now `http://127.0.0.1:3000/**`.
- **Demo data:** the five live event dates were refreshed (all future; deadlines now after their
  start dates), and `seed.sql` was corrected plus now refreshes dates on re-run. `/about` says four
  of the five are pinned and the fifth is online.
- **Tests:** `npm run test:db` = **70/70** (adds QR check-in, account-deletion cascades, retired-
  table access); `npm run test:ui` passes and now covers `/api/verify/bulk` and the terms →
  birthday gate for a session created outside the sign-up form (the OAuth shape).
- **Uncommitted:** all of the above is in the working tree. Commit before the repo goes public.

## 2026-10-22 — demo mode, community impact, check-in trust, pilot, a11y/CI
- **Migrations added and applied to production 2026-10-22:** `20261022000000_impact_summary.sql`,
  `20261022000100_checkin_trust.sql`, `20261022000200_pilot_requests.sql`,
  `20261022000300_protect_demo_accounts.sql`.
- **Live demo `/demo`:** one-click student and organizer sign-in with server-only passwords
  (`DEMO_STUDENT_PASSWORD` / `DEMO_ORGANIZER_PASSWORD`, generated and stored by `deploy.sh` in
  `.env.deploy.local`). `supabase/seed-demo.mjs` / `npm run seed:demo` creates the demo org
  (fictional, unverified), three events, 9 verified hours across three causes, one pending 2h log,
  a check-in and `IMP-DEMO2026ABCD`. The verify page labels demo codes; the demo banner marks the
  shared accounts. `deploy.sh` seeds the demo after each deploy.
- **Community impact `/impact`:** `impact_summary()` RPC aggregates verified hours by cause,
  organization, month and event map; the page shows a Leaflet map, cause bars, a months chart and
  "causes still waiting for hours". No student identity is returned. Privacy note says demo
  records are included until a real pilot.
- **Check-in trust:** `event_checkins.distance_m` and `outside_window`; `check_in_event` accepts
  optional lat/lon, `record_checkin_location` adds it later; **coordinates are used only to
  compute the distance and are never stored**. The organizer sees "0 m / 42 m / 12.1 km from the
  event" and "outside event window". `/privacy` and `/safety` updated to match.
- **Pilot program `/pilot` + `/pilot/guide`:** insert-only `pilot_requests` table, rate-limited
  `POST /api/pilot`, printable guide, and `PILOT.md` outreach playbook (NHS/Key Club/library,
  three-email sequence, what counts as evidence).
- **Implementation/UX:** organizer approval queue moved above stats/trends/attendance; the landing
  hero no longer shows "Hour logs approved 0" and its demo code is real; the duplicate demo event
  titles were renamed; demo org is unverified to match the public disclosure.
- **Tests/CI:** `test:db` now **77 checks** (impact RPC, distance/window, no-coordinate storage,
  retired tables); `test:ui` passes; new `test:a11y` (axe-core WCAG 2.1 A/AA) passes locally and
  against production on `/`, `/impact`, `/demo`, `/verify`, `/opportunities`, `/safety`, `/pilot`,
  `/pilot/guide` and both demo roles. CI has a second job that starts local Supabase, runs the DB
  suite and the a11y gate; a push will be its first real run.
- **Dependencies:** upgraded Next.js + eslint-config-next `16.2.9` → `16.4.2` (fixes the critical
  Next advisory); `npm audit --omit=dev` now reports **0 vulnerabilities**.
- **Next 16.4.2 redirect fix:** the complete-profile and accept-terms forms now use
  `window.location.assign()` instead of `router.push()`; the client router was reusing a prefetched
  gated response and bouncing back. The birthday gate e2e caught it.
- **Validation:** the pilot kit is ready, but a real pilot is still user-only. `/about` still says
  "No real pilot group yet" — keep it until a real group runs one event, then add the numbers and a
  permitted quote.

## Goal
Win the Congressional App Challenge (deadline Oct 26 2026, district assumed NJ-6). Judged on
idea, implementation, video. AI use must be disclosed in the entry.

## What exists
Core loop (verified: `tsc` + `eslint` + `next build` = 37 routes; `npm run test:db` = 37 checks
pass): map of events → one-tap join → QR check-in → log hours → organizer one-tap approval →
`IMP-` code → `/verify/[code]` with no account → printable counselor report → hours goal → the
privacy/attributions surface, PWA, CI. Added this session:
- **Availability** (`profiles.volunteer_availability`, owner-only): day × morning/afternoon/evening
  grid on `/profile`, summary on `/dashboard`; private fields read via the `my_profile()` RPC, so
  it is never exposed to anon or to other signed-in users.
- **Weather flag**: `src/lib/weather.ts` (Open-Meteo, keyless, 1 h revalidate) → amber outlook card
  on the event page, for in-person events with coordinates + a date only.
- **Near the event + declared facilities**: organizer-declared `opportunities.facilities` on the
  post-event form; `NearTheEvent` fetches `/api/nearby`, which proxies the Overpass API
  **server-side** (mirrors tried in turn: maps.mail.ru → openstreetmap.ru → overpass-api.de → kumi
  → private.coffee; only non-empty answers cached 6 h) for cafés / food / transit within 800 m.
  Server-side because the mirrors are inconsistent about CORS and `overpass.osm.ch` (which does send
  CORS) is a **Swiss-only** extract. Both degrade silently; neither blocks the page.
- **Reachable without a car**: a "Within 3 mi" filter in `EventsExplorer`, shown once "Near me" is
  set (straight-line distance — no routing engine).
- `/about`, `/privacy` and `/attributions` updated to match (bio/skills/location no longer shared;
  availability is private; Overpass and Open-Meteo credited).

## Open items
1. ~~Privacy defect~~ **fixed + deployed**.
2. ~~Audit cleanup~~ **done 2026-10-21** — README/schema, types, proxy rename, dead-table revoke,
   demo dates, and test coverage. See the section above.
3. **OAuth (Google/Apple/Microsoft)** — mechanism is in place but **needs the user's provider
   credentials**. `deploy.sh` sets `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=""`, which hides the
   buttons. The terms → birthday gate is now tested end-to-end without OAuth, but the real provider
   callback `/auth/callback` is still untested.
4. Seeded sample orgs have **no owner**, so hours logged on them can never be approved. The shared
   demo organizer owns the three demo events and already has a pending log, so `/demo/organizer`
   is the working approval demo.
5. **User-only:** demo video, AI-use disclosure, district confirmation, a real pilot (strongest win
   factor).
6. ~~Commit the working tree~~ **done 2026-10-24** — all work is committed and pushed; the
   GitHub CI failure (Node 20 vs native WebSocket) is fixed in this session.
7. **LAUNCH Phase 1** — the repo is public with a LICENSE; **CONTRIBUTING is still missing**.
   `.cursor/memory/long-term.md` was refreshed on 2026-10-22 (untracked, not shipped).
8. **Validation blocker:** all coding/UX metrics are addressed; a 10/10 evidence score needs one
   real group to run one event through `/pilot`. Then add the numbers and a permitted quote to
   `/about` and the landing page.
9. ~~Repo ingest~~ **done** — 48 one-page maps in `/Users/togi/notes/repo-map/`.
10. ~~Legal archive~~ **done** — all 14 sources retrieved; see `notes/legal/MANIFEST.tsv`.

## Hard-won gotchas
- `authenticated` **cannot** `SELECT date_of_birth` (column revoked) — use the `my_profile()` RPC.
- `profiles` SELECT is column-granted, not table-granted: a new column is **invisible** to
  `anon`/`authenticated` until you `GRANT` it (this is what keeps availability private).
- `volunteer_hours.verified_by` has no delete rule; account deletion clears dependents first.
- Never run `npm run build` while another agent edits — one shared `.next/`.
- The agent tool's `model` param takes plain ids only; reasoning effort is not settable per call.
- Verify with real command output; unverified claims compound.

## Guardrails
Never print secrets. Deploy only via `./deploy.sh` (migrations, then Vercel). Don't delete prod data
without approval. Emerald design system with `dark:` variants. Commit with the
`Co-authored-by: CommandCodeBot <noreply@commandcode.ai>` trailer. Keep file scopes disjoint — agents
share one working tree.

## Automatic token guard (installed 2026-10-17)
`~/.commandcode/settings.json` wires user-scope hooks: `PostToolUse` → `~/.commandcode/hooks/token-guard.sh`
(silent under 1.2 MB, requests a HANDOFF update at 1.2 MB, halts at 2.8 MB) and `SessionStart` →
`~/.commandcode/hooks/session-context.sh` (injects this file's pointer + branch + dirty count).
Hooks load at startup — they need a `cmd` restart to take effect.
