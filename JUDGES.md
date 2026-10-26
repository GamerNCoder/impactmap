# ImpactMap — a guide for Congressional App Challenge judges

**One sentence:** ImpactMap lets a student find a local service event, check in, and get hours
approved by the organizer with one tap — producing a code a counselor can verify online in
seconds, without an account and without exposing student contact details.

- **Live app:** https://impactmap.vercel.app
- **Demo, no signup:** https://impactmap.vercel.app/demo
- **Source:** https://github.com/GamerNCoder/impactmap
- **What a code does and does not prove:** https://impactmap.vercel.app/trust

2026 Congressional App Challenge entry, New Jersey's 6th District.

## The problem

Schools, honor societies and scholarships require service hours, but the proof is usually a paper
form. Forms get lost, signatures get faked, and a counselor has no fast way to tell which entries
are real. The numbers make the scale concrete:

- **372:1** — students per school counselor in 2024–25, well above the 250:1 ratio ASCA
  recommends.
- **34.1%** of 16- and 17-year-olds formally volunteered in 2023 — more than any other age group
  that survey measures.
- **$36.14** — the estimated value of one volunteer hour in 2025 (Independent Sector and the Do
  Good Institute).

ImpactMap is built for students in Edison, NJ and the surrounding district — including students
without a car — and for the organizers and counselors who sign off.

## Try the whole loop in about two minutes

1. Open **`/demo` → Student view**. The shared demo student has **9 verified hours**, one pending
   2-hour log, and a **40-hour goal**. Open **Passport** to see the verified entries and the
   printable counselor report.
2. Back on `/demo`, open **Organizer view**. The pending log is waiting under **Hours to approve**.
   Click **Approve 2h**; a verification code is issued immediately.
3. Sign out (or use a private window) and open **`/verify/IMP-DEMO2026ABCD`**. No account needed:
   the event, date, hours and approver are shown.
4. Open **`/impact`** to see verified hours by cause, month, organization and event — aggregated
   with no student names.
5. If a previous visitor already approved the pending log, click **Reset the demo data** on
   `/demo` first. The demo is shared and intentionally writable.

## What is real, and what is demo

| Thing | Status |
|---|---|
| Join → check in → log hours → organizer approval → code → public verification | Real application behavior, enforced by the database |
| Demo student and organizer accounts | Shared accounts with fictional data; every demo record is labeled |
| Five Edison events on the live map | Sample listings from fictional, **unverified** organizers; join counts are honest |
| A real school or club pilot | **None yet** — `/about` says so plainly |
| Social sign-in (Google/Apple/Microsoft) | Built, but disabled until provider credentials exist |
| AI features at runtime | **None** — the app contains no AI |

The demo is deliberately honest: the organizer is labeled unverified, the verification page marks
the record as a demo, and the limits are stated on `/trust`.

## What it does today

- **A map of local events** with search, cause filters, a "Near me" sort and a "Within 3 mi" filter
  for students who cannot drive.
- **One-tap join**, a per-event **check-in QR** for the sign-in table, then hour logging after the
  event.
- **One-tap organizer approval** that issues an `IMP-` code. Students cannot approve their own
  hours — a database trigger refuses it — and an unverified organization cannot issue a code to
  its own member through a second account.
- **Verification without an account**: single codes or up to 200 at once, plus a printable
  counselor report with a QR code per entry.
- **A private record**: the owner's date of birth, email, bio, town and availability are protected
  by column-level grants, not just the interface.
- **A k-anonymous public impact map**: groups with fewer than three distinct volunteers are
  suppressed, and a student total below five is shown as "—".
- **Inclusion**: wheelchair, accessible-restroom and sensory-friendly event attributes and
  filters; a language switcher with a Spanish core volunteer flow; map text alternatives; a
  keyboard and screen-reader path; an offline check-in queue that stores the check-in on the
  device and replays it when online, with a banner that says so — the app never claims to work
  fully offline.
- **Honest limits**: a check-in is a signal, not proof; an unverified organizer's code is their
  attestation, not ImpactMap's endorsement.

## Engineering — what to inspect

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres with
row-level security), Leaflet + OpenStreetMap, and Vercel.

- **Schema and rules live in `supabase/migrations/`** — RLS policies, the self-approval trigger,
  column grants, the k-anonymous `impact_summary()` function, and the audit triggers.
- **The verification path** is `src/app/verify/` plus the `verify_code` RPC; it returns a partial
  name and no free-text notes.
- **The public impact path** is `src/app/impact/` plus `impact_summary()`; it reads as its owner so
  anonymous visitors need no access to the hours table.
- **Tests:** 86 database and security checks (`tests/e2e-core-loop.mjs`), a Playwright walkthrough
  of the full loop (`tests/ui-core-loop.mjs`), an axe-core **WCAG 2.2 AA** gate across 17 public
  pages and both demo roles (`tests/a11y.mjs`), and both theme directions (`tests/theme.mjs`).
- **CI** (`.github/workflows/ci.yml`) runs typecheck, lint, build, the database suite, a
  defense audit, the accessibility gate, the UI walkthrough and the theme test. It is green on
  `main`.
- **Health check:** `GET /api/health` reports database connectivity without secrets.

## How AI was used

AI coding assistants (Claude Code, Command Code and OpenAI Codex) helped write and debug code,
write tests, and review accessibility and security. The problem, features, user flow, trade-offs
and review decisions were mine. The application itself has no AI features.

## Repository map

| Path | What it is |
|---|---|
| `src/app/` | Pages and API routes (map, demo, dashboard, passport, verify, impact, safety, trust) |
| `src/components/` | Client UI components |
| `src/lib/` | Supabase clients, service record, QR, org access, weather, i18n |
| `supabase/migrations/` | Schema, RLS, triggers and grants — the source of truth |
| `supabase/seed.sql`, `seed-demo.mjs` | Local sample data and the shared demo accounts |
| `tests/` | Database, UI, accessibility and theme suites |
| `scripts/` | Deterministic defense and language audits |

Licensed under the MIT License. See `README.md` for local setup and `CONTRIBUTING.md` for the
invariants a change must preserve.
