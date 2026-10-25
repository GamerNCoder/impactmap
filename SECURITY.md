# Security policy

## Reporting a vulnerability

Please report privately through GitHub's **Security** tab: open the repository, choose
**Security**, then **Report a vulnerability**. Do not open a public issue for a vulnerability.

Include the affected route or migration, the steps to reproduce, and what you expected to happen.
This is a student-maintained project, so reports are handled on a best-effort basis.

## Scope

- The deployed app at https://impactmap.vercel.app
- The source in this repository

## By design

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public. Access is enforced by row-level security and
  column-level grants; a report that only shows the key is visible is not a vulnerability.
- Demo accounts and records are shared, labeled as demo data, and intentionally resettable.
- A verification code is a bearer credential: whoever holds it can look up the record. The
  verification page deliberately shows a partial name and no free-text service notes; a
  volunteer's own shared page shows the name they chose to share.

## What is tested

`npm run test:db` (86 checks), `npm run audit:defenses`, and the accessibility, UI and theme
suites run in CI. A security control is expected to ship with a detection test and a migration
that can restore it.
