# ImpactMap — handoff (2026-10-18)

Earlier detail is in git history (`git log -p HANDOFF.md`).

## State
- **Live:** https://impactmap.vercel.app · branch `cac/core-loop` · deployed `0de91a2` (2026-10-18).
- **Privacy fixed and deployed this session.** Migration `20261018120000_profiles_field_privacy.sql`:
  `anon` lost the `profiles` column grants for `location`, `bio`, `skills` (verified on prod:
  `select=location|bio|skills` went **200 → 401**; `id`, `full_name`, `hours_goal` still 200).
  `authenticated` lost them too, so organizers/peers see a name only.
- Migration `20261018130000_event_facilities.sql` adds `opportunities.facilities TEXT[]`.
- Supabase project `impactmap-cac` (ref `zolvpddzpimegnkimzh`). Redeploy: `./deploy.sh`.
- `.env.local` points at the LOCAL Supabase (`127.0.0.1:54321`); local dev needs the CLEAN
  tunnel: `scripts/clean-db.sh up` (tunnel is its own ssh; `clean-db.sh tunnel` re-establishes it).

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
1. ~~Privacy defect~~ **fixed + deployed** (see State).
2. **OAuth (Google/Apple/Microsoft)** — mechanism in place, **needs the user's provider
   credentials**. `deploy.sh` sets `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS=""`, which hides the
   buttons. `/auth/complete-profile` for OAuth sign-ins is still not end-to-end tested.
3. Seeded sample orgs have **no owner**, so hours logged on them can never be approved — the demo
   must post its own event (already honest: no false "verified" badge, zero joins).
4. **User-only:** demo video, AI-use disclosure, district confirmation, a real pilot (strongest win
   factor).
5. ~~Repo ingest~~ **done** — 48 one-page maps in `/Users/togi/notes/repo-map/` (this session added
   `automation.md`, `utm.md`; `flutter.md` is a one-line "SDK copy").
6. ~~Legal archive~~ **done** — all 14 sources retrieved. The three failures were re-fetched from
   the Wayback Machine (the FTC slugs moved; CA `leginfo` is Cloudflare-gated). See
   `notes/legal/MANIFEST.tsv` for the exact URLs and byte counts.

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
