# ImpactMap

[![CI](https://github.com/GamerNCoder/impactmap/actions/workflows/ci.yml/badge.svg)](https://github.com/GamerNCoder/impactmap/actions/workflows/ci.yml)

A volunteer service-hour portal built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. Students find local events on a map, join in one tap, check in by QR, log their hours, and get them approved by the organizer with one tap.

**Congressional App Challenge judges: start with [`JUDGES.md`](./JUDGES.md)** — a one-page tour,
the live demo links, and an honest account of what is real and what is sample data.

## Features

- **Find events on a map** — Leaflet + OpenStreetMap pins, a "Near me" distance sort, a "Within 3 mi" filter, plus category and text filters
- **One-tap join** — no application form; join an event and it appears on your dashboard
- **QR check-in** — each event has a check-in QR code volunteers can scan on arrival; attendance is recorded separately from applications so walk-ins count too
- **Check-in trust layer** — volunteers can optionally share their location; the app keeps the distance to the event (never the coordinates) and flags scans outside the event window for the organizer
- **Log hours** — after the event, log your time; the organizer approves it with one tap
- **Verification codes** — each approval issues an `IMP-` code a counselor can check at `/verify` with no account
- **Correction without erasure** — a misclicked approval can be revoked; the code stays and resolves to a marked revoked record, the hours leave every total, and both the revoke and the undo are audited
- **Bulk verification** — counselors can paste a whole class list of `IMP-` codes at once
- **Counselor report** — a printable/PDF service record with a QR code per verified entry
- **Community impact map** — verified hours by cause, month, organization and event, aggregated with no student identities
- **Hours goal** — set a target (for example 40 hours for NHS) and track progress
- **Public record** — share a link to your organizer-approved hours
- **Availability** — mark when you can usually volunteer; visible only to you
- **Event context** — a weather outlook for outdoor events and a "near the event" card for cafés, food and transit
- **Student safety** — 13+ only, guardian consent for 13–15, and date of birth/email/bio/skills/town are hidden from other users in the database itself
- **Row Level Security** — Supabase RLS policies protect user data; students cannot approve their own hours
- **Type-safe data layer** — the generated Supabase schema types are wired into both the server and browser clients, RPCs included
- **Account controls** — export your data or delete your account from the profile page
- **Live demo** — one-click student and organizer demo accounts, no signup
- **Light and dark themes** — follows the OS by default, persists the choice, and darkens the OpenStreetMap tiles with a CSS filter in dark mode
- **Pilot program** — a request form and printable guide for schools, clubs and libraries
- **Inclusion controls** — wheelchair, accessible-restroom and sensory-friendly event attributes and filters, a language switcher with a Spanish core volunteer flow, map text alternatives, and a keyboard/screen-reader path
- **Offline honesty** — a cached shell, a check-in stored on the device and replayed when online, and a banner that says so; the app never claims to work fully offline

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Types | Generated Supabase `Database` types, wired into both clients |
| Maps | Leaflet + OpenStreetMap tiles (dark via CSS filter), Nominatim, Overpass API |
| Weather | Open-Meteo |
| QR | `qrcode`, `html5-qrcode` |
| Deployment | Vercel |
| Tests | Node, Playwright, axe-core |

## Getting started

### 1. Clone and install

Node.js **22.4 or newer** is required: the Supabase client needs the native WebSocket, and CI runs
Node 22. `.nvmrc` is included, so `nvm use` selects it.

```bash
git clone https://github.com/GamerNCoder/impactmap.git
cd impactmap
npm install
```

### 2. Set up Supabase

The SQL migrations in [`supabase/migrations/`](./supabase/migrations) are the source of truth for the schema.

For a hosted project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

For local development (requires Docker):

```bash
supabase start
supabase db reset   # applies every migration, then supabase/seed.sql
```

`supabase/seed.sql` is **local-only sample data** — fictional Edison, NJ events — and is deliberately not pushed to production.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in Supabase → **Project Settings → API**. For local development use `http://127.0.0.1:54321` and the local anon key from `supabase status`.

The demo accounts are optional and server-only:

```env
NEXT_PUBLIC_DEMO_ENABLED=true
DEMO_STUDENT_EMAIL=demo.student@impactmap.app
DEMO_STUDENT_PASSWORD=<random>
DEMO_ORGANIZER_EMAIL=demo.organizer@impactmap.app
DEMO_ORGANIZER_PASSWORD=<random>
```

For local use, run:

```bash
npm run seed:demo   # needs SUPABASE_SERVICE_ROLE_KEY in .env.local
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo is at [`/demo`](http://localhost:3000/demo).

## Social sign-in (Google, Apple and Microsoft only)

The login and signup pages support Google, Apple and Microsoft (Supabase's `azure` provider). GitHub is **not** implemented. Buttons only appear for providers listed in `NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS` (for example `google,apple,azure`); when that variable is empty, no social buttons are shown.

Provider setup: [`supabase/oauth-setup.md`](./supabase/oauth-setup.md).

## Deploy to Vercel

Apply the Supabase migrations to your hosted project, then import the repository in Vercel (or run `vercel --prod`):

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Set these Vercel environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Project Settings → API |

Then set the Supabase **Site URL** and **Redirect URLs** (Authentication → URL Configuration) to the deployed origin plus `/auth/callback`.

## Demo data on the live site

The live site includes five sample Edison events (inserted separately; `seed.sql` itself is not pushed) plus three events from the shared demo organizer. The demo organizations are fictional and unverified; join counts are honest (the demo student is the only joiner). Use [`/demo`](https://impactmap.vercel.app/demo) to sign in as the demo student or organizer without an account. The demo verification code is `IMP-DEMO2026ABCD`, and the verify page labels it as a demo record.

## Pilot program

Schools, clubs and libraries can request a pilot at [`/pilot`](https://impactmap.vercel.app/pilot). Requests are insert-only in `pilot_requests`; the team reads them through the Supabase dashboard. The printable guide is at [`/pilot/guide`](https://impactmap.vercel.app/pilot/guide).

## Health check

`GET /api/health` returns `{ "ok": true, "service": "impactmap", "database": "ok", "latency_ms": 10 }`, or a `503` with `database: "unreachable"` if the Supabase query fails. It is public, has no secrets, and is safe to use for an uptime monitor.

## Tests

- `npm run test:db` — 101 database and security checks against a running Supabase (`tests/e2e-core-loop.mjs`); reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`
- `npm run test:ui` — Playwright walkthrough of the health endpoint, the full student → organizer → counselor loop, bulk verification and the terms/birthday gate (`tests/ui-core-loop.mjs`); start `npm run dev` first, or set `BASE_URL` to run it against a deployed site
- `npm run test:a11y` — axe-core WCAG 2.2 A/AA gate on the public pages, both demo roles, `/pilot` and the guide (`tests/a11y.mjs`); requires a running app
- `npm run test:theme` — Playwright checks both OS color schemes and both toggle directions (class, storage, body/card colors, and the dark map-tile filter); requires a running app
- `npm run audit:defenses` — detection layer for the grant, profile-privacy, impact-RPC, demo-reset-origin and header controls; reads `SUPABASE_URL` and `SUPABASE_ANON_KEY`, and adds live header checks when `BASE_URL` is set
- CI runs `tsc`, `eslint`, `next build`, the database suite, the defense audit, the accessibility gate, the UI walkthrough and the theme test (`.github/workflows/ci.yml`)

## Project structure

```
src/
├── app/                 # App Router pages and API routes
│   ├── about, accessibility, attributions, offline, privacy, safety, security, terms, trust
│   ├── api/             # geocode, nearby, me/export, org exports, pilot, track, health, verify/bulk, demo/reset
│   ├── auth/            # login, signup, OAuth callback, terms, complete-profile
│   ├── checkin/[id]/    # QR check-in landing page
│   ├── dashboard/       # joins, hours, approvals
│   ├── demo/            # one-click student and organizer demo
│   ├── impact/          # public aggregate impact map
│   ├── opportunities/   # map, detail, new event
│   ├── organizations/   # directory and organizer dashboard
│   ├── passport/        # verified record and printable report
│   ├── pilot/           # pilot request page and printable guide
│   ├── profile/         # profile, availability, goal, export, deletion
│   └── verify/          # public IMP- code lookup (no account)
├── components/          # client UI components
├── lib/                 # auth, QR, service record, org access, weather, Supabase clients
└── types/               # generated Supabase types
supabase/
├── migrations/          # schema and RLS source of truth
├── seed.sql             # local-only sample data
├── seed-demo.mjs        # idempotent shared demo accounts and records
└── oauth-setup.md
tests/                   # database, UI, accessibility and theme suites
scripts/                 # deterministic audits (defenses, languages)
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, test commands and the trust/privacy invariants a change must preserve.
