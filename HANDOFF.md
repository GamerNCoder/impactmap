# ImpactMap — Congressional App Challenge handoff (2026-10-09)

**Goal:** Submit ImpactMap to the Congressional App Challenge. A website is allowed. The deadline is **Oct 26, 2026** (check your district's page). You must disclose AI use in the entry. Target: app working within 48 hours.

**Pitch:** Students find local volunteer events, check in by QR code, the organizer approves their hours, and the student shares an IMP- code their counselor can verify.

## State
- Repo `~/Projects/impactmap`, branch `cac/core-loop`, 3 commits:
  1. Snapshot of the uncommitted app work. Automation factory files (`notes/ scripts/ profiles/ repos/ tests/`) are in `.gitignore` and still on disk.
  2. Cut pricing, solutions, security, transfers, messages, groups, community, skill tests, analytics pages, `api/v1` and the AI Copilot.
  3. Rewrote the landing page, layout metadata and footer for student service hours.
- `npx tsc --noEmit` and `eslint` are clean. The dev server runs with `npm run dev` on :3000.
- The automation factory is **not** being used: its config points at Automation Hub tests.

## Blocker
The Supabase project `pgvasfubdwkgugoqqfjf` no longer exists (NXDOMAIN), so every database query fails. The user needs to:
1. Create a new Supabase project.
2. Put its URL and anon key in `.env.local`.
3. Run `supabase/schema.sql`, then `supabase/seed.sql`, in the SQL Editor.

Also needed: the user's city or district, to rewrite the seed with local events. (The current seed uses generic example.com orgs.)

## Next steps
1. Once the database is up, test the full loop in the browser: sign up → onboarding → join event → QR check-in → log hours → org approves → `/passport` → `/verify/[code]`.
2. Decide whether to keep ID upload on `/profile` (IdVerificationForm). Collecting ID documents from minors is a privacy concern, so cutting it is probably best.
3. Keep at most one AI feature, the SkillMatch insight. Check which provider `src/lib/ai.ts` uses.
4. Mobile and accessibility pass.
5. Deploy on Vercel (a workflow exists in `.github/`). Then the demo video and the AI-use disclosure.
