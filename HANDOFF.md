# ImpactMap — handoff (2026-10-17)

Earlier detail is in git history (this file was rewritten to cut token cost; see `git log -p HANDOFF.md`).

## State
- **Deployed and current:** commit `60d10bc` on `cac/core-loop`. Live: https://impactmap.vercel.app
- Production verified this session: `/about`, `/accessibility`, `/security` → 200; RPCs `check_in_event` and `delete_my_account` both present.
- Supabase project `impactmap-cac` (ref `zolvpddzpimegnkimzh`). Redeploy: `./deploy.sh` (pushes migrations, then Vercel). Migrations-only — it no longer pushes the seed.
- `.env.local` points at the LOCAL Supabase (`127.0.0.1:54321`), so local dev needs the CLEAN tunnel via `scripts/clean-db.sh up`.

## Goal
Win the Congressional App Challenge (deadline Oct 26 2026, district assumed NJ-6). Judged on idea, implementation, video. AI use must be disclosed in the entry.

## What exists (all verified by tsc + eslint + next build; 30 routes)
Core loop: map of events → one-tap join → **QR check-in that records attendance** (`event_checkins`, `/checkin/[id]`) → log hours → organizer one-tap approval → `IMP-` code → `/verify/[code]` with no account → printable counselor report with QR per entry → hours goal → public record.
Also: **bulk code check for a counselor** (`/api/verify/bulk`, 200-cap, rate-limited) merged with single lookup into ONE auto-detecting field; organizer dashboard (attendance, turnout, hours trend, honest zero-states); PWA + offline check-in queue; `/about` for judges with **cited** sources; a11y pass (modal focus trap, Escape handling, skip link, tablist); self-serve **account deletion + JSON data export**; legal surface (`LICENSE` MIT, `/accessibility`, `/attributions`, `/security`, hardened privacy/terms); CI (`.github/workflows/ci.yml`). 19 files of unreachable SaaS cruft were deleted earlier.

## Open items
1. **Privacy defect, live and unfixed.** `anon` holds column grants on `profiles` `id, full_name, location, bio, skills` and the policy is `USING (true)` — so any anonymous visitor can enumerate every student's town, bio and skills (verified: `select=id,location` → 200 from the REST API; `[]` only because no students exist yet). DOB/email/guardian are correctly locked down; location/bio/skills are not. Fix before anyone signs up.
2. **OAuth (Google/Apple/Microsoft) — requested, unfinished.** Mechanism established: `[auth.external.*]` in `supabase/config.toml` with `secret = "env(VAR)"`, applied by `supabase config push`. `deploy.sh` currently sets `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` to empty, which *hides* the buttons. Needs the user's provider credentials. Apple needs a **paid** developer account and a client secret that **expires every 6 months**; Azure needs the `email` scope and consideration of the `xms_edov` claim. Users signing in via OAuth land on `/auth/complete-profile` for the birthday/guardian gate — that path is NOT end-to-end tested.
3. Seeded sample orgs have **no owner**, so hours logged on them can never be approved. The demo must post its own event. Sample orgs are already stripped of the false "verified" badge and fake join counts.
4. **User-only:** demo video, AI-use disclosure, district confirmation, a real pilot (the single strongest win factor).
5. Research agent `bg-21` is writing `notes/monetization.md`.
6. Repo ingest: requested, **not done** (both attempts were aborted). Facts: kit registry has 28 repos, **17 are DGX-only**, local ones are multi-GB (`wisprflow` 4.3G, `CaaS` 2.9G, `HumanTyper` 864M). Kit's `knowledge.db` is 0 bytes. Plan was a one-page repo map per local repo.
7. Legal archive: `notes/legal/` has 11 primary sources + `MANIFEST.tsv`. **3 fetches failed** and need retry with other URLs: 2 FTC pages (404) and California CCPA (403).

## Recommended but unbuilt (each verified feasible)
- **Availability** — `profiles.volunteer_availability TEXT[]` already exists and is dead. Must be **owner-only** (via `my_profile()`); never expose minors' availability to organizers. Keep to day-of-week + coarse slots — no clock times, avoids DST.
- **Weather risk flag** — Open-Meteo verified **keyless**, live call returned 7-day data for the Edison coords. Informational flag only; **no notifications** (no email/push provider exists).
- **"Near the event" card** — Overpass verified working but requires **POST + a User-Agent** (GET → 406). Near Roosevelt Park it returned cafes/restaurants/bus stop but **0 toilets and 0 drinking water**, so restrooms must come from **organizer-declared facilities**, not OSM.
- **Travel** — straight-line distance already computed; **transit itineraries are out of scope** (needs a routing engine). Strongest framing: "reachable without a car" filter.

## Hard-won gotchas
- `authenticated` **cannot** `SELECT date_of_birth` (column revoked) — read it via the `my_profile()` RPC or it errors at runtime.
- `volunteer_hours.verified_by` has **no delete rule**; any account-deletion RPC must clear dependents first.
- The agent tool's `model` param takes **plain ids only** — `deepseek/deepseek-v4.1-flash:high` is rejected as unknown. Verified working: `deepseek/deepseek-v4.1-flash`, `gpt-6-luna` (both Go tier). `claude-opus-5-5` needs **Max** and errored instantly. Reasoning effort is **not** settable via the tool (only custom-agent-file `reasoningEffort`), so sub-agents run at the session's `/effort`.
- Each sub-agent launch costs **~18k tokens of fixed overhead** regardless of prompt size — batch questions, and have agents write to files instead of returning long reports.
- **Never run `npm run build` while other agents are editing** — they share one `.next/` and corrupt it.
- Do not create test users in production. Verify with real command output; unverified claims compound.

## Guardrails
Never print secrets. Deploy only via `./deploy.sh`. Don't delete prod data without approval. Emerald design system with `dark:` variants everywhere. Commit with the `Co-authored-by: CommandCodeBot <noreply@commandcode.ai>` trailer. Preserve other agents' edits: agents share one working tree, so keep file scopes disjoint.
