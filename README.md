# ImpactMap

A volunteer service-hour portal built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. Students find local events on a map, join in one tap, log their hours, and get them verified by the organizer.

## Features

- **Find events on a map** — Leaflet + OpenStreetMap pins, a "Near me" distance sort, plus category and text filters
- **One-tap join** — no application form; join an event and it appears on your dashboard
- **QR check-in** — each event has a check-in QR code volunteers can scan on arrival
- **Log hours** — after the event, log your time; the organizer approves it with one tap
- **Verification codes** — each approval issues an `IMP-` code a counselor can check at `/verify` with no account
- **Counselor report** — a printable/PDF service record with a QR code per verified entry
- **Hours goal** — set a target (for example 40 hours for NHS) and track progress
- **Public record** — share a link to your organizer-approved hours
- **Student safety** — 13+ only, guardian consent for 13–15, and date of birth/email are hidden from other users in the database itself
- **Row Level Security** — Supabase RLS policies protect user data; students cannot approve their own hours

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Deployment | Vercel |

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/heyitsmeyourbudlol-lgtm/impactmap.git
cd impactmap
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run `supabase/schema.sql`
3. Run `supabase/seed.sql` for sample organizations and opportunities
4. Enable Email auth under **Authentication → Providers**
5. (Optional) Enable Google/GitHub OAuth and set redirect URL to `http://localhost:3000/auth/callback`

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in Supabase → **Project Settings → API**.

### Social sign-in (Google, Apple, GitHub, Microsoft)

The login and signup pages support all four providers. Enable each one in Supabase with OAuth credentials from the provider:

**Setup guide:** [`supabase/oauth-setup.md`](./supabase/oauth-setup.md)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A: Vercel CLI (fastest)

```bash
npx vercel login
npx vercel --prod \
  -e NEXT_PUBLIC_SUPABASE_URL=https://pgvasfubdwkgugoqqfjf.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Option B: Import from GitHub

1. Import [github.com/heyitsmeyourbudlol-lgtm/impactmap](https://github.com/heyitsmeyourbudlol-lgtm/impactmap) at [vercel.com/new](https://vercel.com/new)
2. Add environment variables (see below)
3. Deploy

### Environment variables (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pgvasfubdwkgugoqqfjf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Project Settings → API |

### Supabase auth URLs (after Vercel deploy)

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Redirect URLs:** `https://your-app.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

## Supabase project

This repo is wired to Supabase project **impactmap-cac**. The paused `impactmap`
project from an earlier iteration still exists but is unused.

- Schema applied via the migrations in `supabase/migrations/`
- Seed data: 5 Edison, NJ demo events
- Dashboard: [supabase.com/dashboard](https://supabase.com/dashboard)

## Tests

- `npm run test:db` — 26 database and security checks (`tests/e2e-core-loop.mjs`)
- `npm run test:ui` — Playwright walkthrough of the full student → organizer → counselor loop (`tests/ui-core-loop.mjs`); set `BASE_URL` to run it against a deployed site

## Project structure

```
src/
├── app/
│   ├── auth/          # Login, signup, OAuth callback
│   ├── dashboard/     # Applications & hours tracking
│   ├── opportunities/ # Browse & detail pages
│   ├── organizations/ # Organization listings
│   └── profile/       # Volunteer profile editor
├── components/        # Shared UI components
├── lib/supabase/      # Browser & server Supabase clients
└── types/             # Database TypeScript types
supabase/
├── schema.sql         # Database schema + RLS
└── seed.sql           # Sample data
```

## License

MIT
