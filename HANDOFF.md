# ImpactMap — Congressional App Challenge handoff (2026-10-11)

**Goal:** Submit ImpactMap to the Congressional App Challenge. A website is allowed. The deadline is **Oct 26, 2026** (check your district's page). You must disclose AI use in the entry.

**Pitch:** Students find local volunteer events, check in by QR code, the organizer approves their hours, and the student shares an IMP- code their counselor can verify.

## State: the core loop works end to end (locally)
- Branch `cac/core-loop`, pushed to GitHub.
- The database runs locally with `supabase start` (Docker). The schema is `supabase/migrations/20261011000000_schema.sql`, rebuilt from the app's queries. Row-level security means students can't verify their own hours, and nobody can take over an org they didn't create.
- Tests (both passing):
  - `npm run test:db`: 22 database and security checks.
  - `npm run test:ui`: a phone-size browser walkthrough. Two accounts sign up → the coordinator posts an event → the student joins → the student logs hours → the coordinator approves → the passport shows the code → a signed-out counselor verifies it.
- The ID-document upload is gone (a privacy concern for minors). Signup no longer asks for a phone number and requires age 13+.
- The old cloud env is saved in `.env.dead-cloud.bak`. Its project no longer exists.

## Run locally
Docker/Supabase runs on CLEAN, not the Mac: `scripts/clean-db.sh up` (start + SSH tunnel to localhost:54321-54324), `scripts/clean-db.sh reset` (apply migrations + seed), `scripts/clean-db.sh stop`. Then `npm run dev` → http://localhost:3000.

## 2026-10-12: judge-ready features + simplification
- Map: `/opportunities` shows a Leaflet/OpenStreetMap map of events (Edison default) with "Near me" sorting by distance. New events are geocoded from their address (`/api/geocode/search`).
- Hours goal + counselor report: goal on Home and My hours (`profiles.hours_goal`), printable `/passport/report` with a QR per verified entry.
- Safety: under-16 signup needs guardian name, email and consent; signed-in users can no longer read other users' email, birthday or guardian info (own data via `my_profile()` RPC); CSV export no longer includes student emails; `/safety` page; "Verified organizer" badge.
- Simplified: signup down to 4 fields; onboarding, SkillMatch, AI, commitment score, reviews, badges and "impact value" removed (29 files); nav is Events / Home / My hours / Host an event; organizer approval is one tap, signed as the logged-in organizer.
- Tests: test:db 26 checks, test:ui adds map pins, guardian path, goal and report.

## LIVE (2026-10-11): https://impactmap.vercel.app
- Supabase project `impactmap-cac` (ref zolvpddzpimegnkimszh); state in `.env.deploy.local` (gitignored). The old paused `impactmap` project still exists and is unused.
- `BASE_URL=https://impactmap.vercel.app npm run test:ui` passed. It left test data in prod: org "Austin Park Friends <run>", event "Saturday park cleanup", and 2 example.com users. Delete these in the Supabase dashboard before judging.
- Re-deploy: `./deploy.sh` (idempotent).

## Deploy (needs the user's accounts)
1. `supabase login` and `npx vercel login` (both free).
2. `./deploy.sh` creates the hosted Supabase project, pushes the schema and seed, sets the Vercel env and deploys. It also turns off email confirmation, because free-tier email allows only a few messages per hour.

## Remaining
1. ~~Deploy~~ done. Clean up the prod test data (see above).
2. ~~Local seed events~~ done: Edison, NJ (NJ-6, Rep. Frank Pallone) demo events. Organizers are fictional; locations are real public places.
3. Demo video (judged), plus the AI-use disclosure in the entry form.
