# Contributing to ImpactMap

ImpactMap is a volunteer service-hour portal: students find an event, check in, log hours, and an
organizer approves them; a counselor verifies the resulting `IMP-` code without an account.
Small, focused changes are easiest to review.

## Setup

```bash
git clone https://github.com/GamerNCoder/impactmap.git
cd impactmap
npm install
```

Local Supabase (requires Docker):

```bash
supabase start
supabase db reset          # applies every migration, then supabase/seed.sql
cp .env.example .env.local # fill in the URL and anon key from `supabase status`
npm run dev
```

The schema source of truth is `supabase/migrations/`. Never edit a migration that has already run
in production; add a new one.

## Before opening a pull request

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run test:db          # needs local Supabase and .env.local
npm run test:a11y        # needs the app running
npm run test:ui          # needs the app running
npm run test:theme       # needs the app running
npm run audit:defenses   # needs SUPABASE_URL/SUPABASE_ANON_KEY and, for headers, BASE_URL
```

Say what you changed and which commands you ran. A change is not done because it compiles; it is
done when the relevant suite passes.

## Invariants a change must preserve

These are release gates, not suggestions:

- **No self-approval.** A student cannot approve their own hours; the database trigger enforces it,
  not the interface. An unverified organization cannot issue a code to its own member through a
  second account.
- **Check-in is a signal, not proof.** Distance is self-reported, coordinates are not stored, and
  the copy must never imply that a check-in proves attendance.
- **Public impact is k-anonymous.** Suppress groups with fewer than three distinct volunteers and a
  total student count below five; show an explanation instead of an empty "0 students" panel.
- **Public verification is by code only.** Never expose a public table of student hours, contact
  details or supervisor emails.
- **Unverified organizers are labeled** wherever their code appears. A code is the organizer's
  attestation, not ImpactMap's endorsement.
- **Never fabricate a pilot or quote.** Demo records are labeled as demo records.
- **Inclusion is a release gate.** Keep the wheelchair/sensory attributes and filters, the map text
  alternative, the QR fallback, keyboard/screen-reader paths, and the Spanish core flow working.
  Do not claim full translation or full offline behavior.
- **No runtime AI features.** The app has none; keep it that way unless the claim and disclosure
  change together.

## Security

Please report a vulnerability privately through the repository's **Security** tab (GitHub security
advisories) instead of opening a public issue. Security controls ship with a primary control, an
independent backup (`npm run audit:defenses`), a restore path (migrations), and evidence. If a
change touches grants, RLS, verification or the demo, add or update a test that fails when the
control is removed.

## License

By contributing you agree that your contribution is licensed under the MIT License in `LICENSE`.
