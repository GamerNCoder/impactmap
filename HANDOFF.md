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
`supabase start && npm run dev` → http://localhost:3000

## NEXT ACTION (as of 2026-10-11): deploy is blocked on logins
- Checked 2026-10-11: `supabase projects list` fails (not logged in), and the Vercel token is invalid.
- Ask the user to type `! supabase login` and `! npx vercel login` in the prompt, then run `./deploy.sh` (verify both logins first).
- After deploy: `BASE_URL=<live url> npm run test:ui`, give the user the URL, and commit/push any changes.
- Docker is only for the local DB (`supabase start`). The live site doesn't need it, and Docker can be quit after deploy.
- A Stop hook in `.claude/settings.local.json` runs `~/bin/git-checkpoint`, which snapshots the files to `refs/checkpoints/auto` after every turn.

## Deploy (needs the user's accounts)
1. `supabase login` and `npx vercel login` (both free).
2. `./deploy.sh` creates the hosted Supabase project, pushes the schema and seed, sets the Vercel env and deploys. It also turns off email confirmation, because free-tier email allows only a few messages per hour.

## Remaining
1. Deploy (above), then run `BASE_URL=<live url> npm run test:ui`.
2. Replace the generic example events in the seed with local ones (needs the user's city or district).
3. Demo video (judged), plus the AI-use disclosure in the entry form.
