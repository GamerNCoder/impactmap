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

## Maintaining this brief

This is a living operating brief, not a one-time memo. Every feature, schema migration, security
rule, accessibility/i18n change, or scope cut updates it **in the same change**. If a decision
changes an invariant, change the invariant here first, then the code. At the end of each work
session, update **Current state** and append to the **Decision log**. A change is not done until
the brief matches the app.

## Current state (2026-10-23)

In the working tree, not yet committed: the self-approval DB trigger, unverified-organizer
warning on `/verify`, bulk `organizer_verified` field, k-anonymous `impact_summary`, demo reset
route/button, demo seed date correction, self-dealing and 3-volunteer e2e tests, and OpenStreetMap
maps with a client-side dark filter (CARTO's keyless tiles retired).

Open: `/impact` UI suppression copy, bulk-verify organizer warning UI, second-account/coordinator
self-dealing, public `volunteer_hours` grants, open redirects, CSV injection, a11y map/QR/paths,
language switcher + Spanish core, wheelchair/substance flags, commit/push + migration apply.

## Decision log

- **2026-10-23** — Trust invariants: no self-approval; check-in is a signal, not proof; public
  impact k-anonymous (3 distinct volunteers, 5 student total); unverified organizers always
  labeled.
- **2026-10-23** — CARTO keyless basemap tiles retired; use OpenStreetMap in both themes with a
  dark CSS filter; no keyed basemap.
- **2026-10-23** — Inclusion is a release gate: wheelchair/sensory filters, map text alternatives,
  Spanish core, language switcher; no full-offline claim.
- **2026-10-23** — The audit's trust/privacy fixes outrank new features; record the full demo
  loop after the fixes.
