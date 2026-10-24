# ImpactMap — product invariants

This is the operating brief for every change. If a feature fights it, the feature loses.

## Who we serve

- **Students, 13–18**, including disabled students, non-English speakers, low-bandwidth/
  low-end-device users, and students without a car.
- **Organizers** at schools, nonprofits, food banks, faith groups and community centers.
- **Counselors and schools** verifying service without an account.
- **Parents/guardians**, especially for under-16 participants.

Inclusion is a release gate, not a marketing line:

- Wheelchair/sensory access must be an event attribute and filter (`wheelchair_accessible`,
  `accessible_restroom`, `sensory_friendly`), organizer-declared and never "verified".
- A substance-free (`alcohol_free`/`smoke_free`) badge is allowed, organizer-declared, optional;
  do not imply ImpactMap can verify it.
- Maps need a text alternative; the QR needs a copyable URL/code; the volunteer path must work
  with a keyboard and a screen reader.
- A language switcher and a Spanish core volunteer flow (find event → join → check in → hours →
  verify) are required. Never claim full translation.
- Offline means: cached shell, static assets, and the check-in queue with honest "not recorded"
  copy. Never claim the whole app works offline.

## Who judges it

District judges selected by the Member's office — typically local educators, tech/community
leaders, and congressional staff; not all professional coders.

The rubric: **idea quality, implementation/UX, demonstrated coding skill, and the student's
explanation/video.** Real-world validation helps credibility but is not a substitute for the
rubric.

## What wins

A real, specific local problem; a working end-to-end loop; original code a judge can inspect;
clear UX; evidence (tests, a pilot or permitted quote); a student who can explain trade-offs.

- **Relate:** a named place and user, a concrete before/after, local stakes.
- **Glue:** problem → failed status quo → demo → impact → next step. Not a feature list.
- **Interest:** one sharp insight. Ours: verified service without exposing student identities —
  the trust layer, not another AI wrapper.

## Trust invariants (non-negotiable)

1. A student cannot approve their own hours. The single-account case is blocked by the DB
   trigger; the second-account/coordinator-collusion path must either be blocked by requiring a
   verified organizer to issue codes or be labeled "unverified organizer" wherever a code appears.
2. Check-in is an attendance **signal**, not proof. Distance is self-reported; never call it
   proof. Require an accepted application in `check_in_event`.
3. Public impact is k-anonymous: suppress groups with fewer than 3 distinct volunteers; suppress
   the student total below 5; show a clear explanation instead of "0 students" or empty panels.
4. Public verification is by code only. Never expose a public table of student hours, supervisor
   emails, or profile fields beyond what the privacy page promises.
5. The demo must be repeatable (reset pending log/name), dates must be plausible, and demo
   records must be labeled. Never fabricate a pilot or quote.

## 48-hour order of operations

1. Commit/push the working tree; confirm the new migrations are in the repo and applied.
2. Close the second-account self-dealing claim (verified-organizer gate or explicit label).
3. Fix the `/impact` "Students 0"/empty-panel contradiction; render `organizer_verified` in bulk
   verify.
4. Fix open redirects, CSV formula injection, over-broad grants, demo-reset env/confirmation.
5. Add map text fallback, QR code fallback, a11y paths/keyboard check, wheelchair/substance
   filters, language switcher + Spanish core.
6. Record the full loop and submit. Do not start a full i18n, full offline, or org-vetting
   rewrite.

## Never claim

- "Works offline" for the whole app.
- "Verified" for an unverified organizer's code.
- That a check-in/distance proves attendance.
- That a pilot exists without a real, permitted quote.
- That the app has AI features; it has none at runtime.

## Defense in depth / honeypot / zero-day

Every security control ships with a primary control, an independent backup, a detection test
(`npm run audit:defenses`), a versioned restore (`scripts/reapply-defenses.sh`), and saved
red-team evidence. The hidden `/api/security/canary` honeypot logs hashed metadata only and
returns 404; never give it data access. Incident response and zero-day posture live in
`SECURITY-PLAYBOOK.md`. A security change is not done until removing the primary makes the
audit fail.

## Maintaining this brief

This is a living operating brief, not a one-time memo. Every feature, schema migration, security
rule, accessibility/i18n change, or scope cut updates it **in the same change**. If a decision
changes an invariant, change the invariant here first, then the code. At the end of each work
session, update **Current state** and append to the **Decision log**. A change is not done until
the brief matches the app.

## Current state (2026-10-24)

Implemented and building: self-approval DB trigger; unverified-organizer warning on `/verify`;
bulk `organizer_verified` warning; k-anonymous `impact_summary` with matching `/impact` copy;
demo reset with origin check, confirmation, and a `reset_demo()` RPC (no runtime service key);
safe `next` paths; CSV formula neutralization; check-in requires an accepted application;
wheelchair/accessible-restroom/sensory/substance fields, filters, cards and detail badges; map/QR
text alternatives; broader a11y route gate; OpenStreetMap maps with a dark filter (CARTO keyless
tiles retired); self-dealing and 3-volunteer e2e tests; language switcher with Spanish core
volunteer flow (two dictionaries of 100 profiles; a profile is metadata, not a translation claim);
expiring codes, audit triggers, verification requests, CSV event import, calendar/JSON export,
`/offline`, `/robots.txt`, `/sitemap.xml`, `/trust`, and a rate-limited public verify surface.

Least privilege is restored on top of the defense-in-depth revoke: `anon` reads `profiles` only as
id/full_name/hours_goal; `authenticated` reads only public profile columns (no email, birthday,
location, bio, availability, terms or admin flag) and organizations reads exclude billing
columns, while writes stay table-level and RLS-scoped; `impact_summary()` runs `SECURITY DEFINER`
with a pinned `search_path` so `anon` needs no `volunteer_hours` grant. `npm run audit:defenses`
fails if anon can read private profile fields or if the impact RPC stops answering. The demo
reset route fails closed on a missing Origin as well as a cross-site one.

CI runs on Node 22 because `@supabase/supabase-js` requires native WebSocket; the DB suite is
83 checks against a freshly reset database. Local 2026-10-24: `test:db` 83/83, `test:a11y` 10/10
pages, `test:ui` full loop, `test:theme`, `tsc`, `eslint` and `next build` clean.

Still open: audit-log integrity (authenticated inserts with a null `user_id` are still accepted);
user-only demo video, AI-use disclosure and submission; OAuth provider credentials; a real pilot;
and the live deploy/verification of the 2026-10-24 security migration. Full offline is a non-goal.

## Decision log

- **2026-10-24** — Demo reset is fail-closed: a missing `Origin` is rejected (403), not silently
  allowed. The reset form is a same-origin POST, so every browser flow still passes.
- **2026-10-24** — CI runs Node 22: supabase-js needs native WebSocket, so the Node 20 DB job
  failed before the first assertion.
- **2026-10-24** — Column grants are the backup to RLS, not a formality: `REVOKE SELECT` on a
  table also clears its column ACLs, so the migration rebuilds each role's exact column set.
  The public impact aggregate runs `SECURITY DEFINER` with a pinned `search_path` instead of
  granting `anon` a `volunteer_hours` grant.
- **2026-10-23** — Trust invariants: no self-approval; check-in is a signal, not proof; public
  impact k-anonymous (3 distinct volunteers, 5 student total); unverified organizers always
  labeled.
- **2026-10-23** — CARTO keyless basemap tiles retired; use OpenStreetMap in both themes with a
  dark CSS filter; no keyed basemap.
- **2026-10-23** — Inclusion is a release gate: wheelchair/sensory filters, map text alternatives,
  Spanish core, language switcher; no full-offline claim.
- **2026-10-23** — The audit's trust/privacy fixes outrank new features; record the full demo
  loop after the fixes.
