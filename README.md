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

1. Push this repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Update Supabase **Authentication → URL Configuration** with your Vercel domain:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

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
