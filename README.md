# ImpactMap

A production-ready volunteering portal built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. Connect volunteers with nonprofits, apply to opportunities, and track volunteer hours.

## Features

- **Browse opportunities** — search and filter by category, location, and remote availability
- **Organization profiles** — explore verified nonprofits and their open roles
- **Volunteer accounts** — email/password sign-up plus Google and GitHub OAuth
- **Applications** — apply with cover letter, availability, and experience
- **Dashboard** — track application status and log volunteer hours
- **Profile management** — skills, bio, location, and contact info
- **Row Level Security** — Supabase RLS policies protect user data

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

This repo is wired to Supabase project **impactmap** (`pgvasfubdwkgugoqqfjf`).

- Schema applied via migration `impactmap_initial_schema`
- Seed data: 4 organizations, 5 opportunities
- Dashboard: [supabase.com/dashboard/project/pgvasfubdwkgugoqqfjf](https://supabase.com/dashboard/project/pgvasfubdwkgugoqqfjf)

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
