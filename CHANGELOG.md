# Changelog

## 0.4.0 — 2026-10-24

Security hardening, CI coverage and the open-source release.

### Security
- Restored least privilege after the defense-in-depth revoke: `anon` reads `profiles` only as
  id/full_name/hours_goal; `authenticated` reads only public profile columns and organizations
  reads exclude billing columns, while writes stay table-level under RLS. `impact_summary()` runs
  `SECURITY DEFINER` with a pinned `search_path` and still returns only k-anonymous aggregates.
- `POST /api/demo/reset` now fails closed: a missing or cross-site `Origin` returns 403.
- Audit rows must be attributed: the INSERT policy requires `user_id = auth.uid()`, so a signed-in
  account cannot forge an anonymous entry.

### Fixed
- CI ran Node 20, where the Supabase client refuses to start without native WebSocket. Both jobs
  now run Node 22.4+; `.nvmrc` and `engines` make the requirement explicit.
- A fresh database reset exposed table-wide profile and organization SELECT grants left by the
  defense migration. A new migration rebuilds the exact column sets, and the database suite fails
  if they reopen.

### Added
- `npm run audit:defenses` runs in CI, and the UI walkthrough asserts the demo-reset origin cases.
- `SECURITY.md`, `CONTRIBUTING.md` and a tracked `.env.example`.
- The public repository now contains only the app, migrations and seed data, the test suites, the
  two deterministic audits, CI and the public docs.

### Changed
- Dark mode darkens the OpenStreetMap tiles with a CSS filter; the CARTO keyless basemap is
  retired.

### Verified
- `test:db` 86/86, `test:a11y` 10/10, `test:ui`, `test:theme`, `audit:defenses` 11/11, `tsc`,
  `eslint`, `next build`, and CI green.

## 0.3.1 — 2026-10-22

Light/dark theme correctness and dark map tiles.

### Fixed
- The theme toggle no longer desyncs from an OS-dark session. `resolvedTheme` is now hydration-safe (the server snapshot is light; the client snapshot follows the stored/system theme), so an OS-dark first visit renders a dark page **and** a "Switch to light mode" toggle; the first click matches the label.
- Invalid stored theme values no longer produce a stuck non-theme; they fall back to `system`.
- Leaflet basemaps now follow the theme: OpenStreetMap light tiles in light mode, CARTO `dark_all` tiles in dark mode, with the CARTO attribution added to `/attributions`.

### Added
- `tests/theme.mjs` / `npm run test:theme`: both OS color schemes × both toggle directions, storage, body/card colors, and the dark/light map tile URLs. Wired into CI after the UI walkthrough.

## 0.3.0 — 2026-10-22

Type-safe data layer, a health endpoint and UI coverage in CI.

### Added
- **Typed Supabase clients**: `src/lib/supabase/server.ts` and `client.ts` now use the generated `Database` schema; `src/types/database.ts` was regenerated from the current schema (including `event_checkins.distance_m`/`outside_window`, `pilot_requests` and the current RPCs). Untyped `as never` RPC casts were removed and generated-type nullability was fixed in the export, manage, opportunity, organization, audit and analytics paths.
- **`GET /api/health`**: a public liveness + database check returning `ok`, `service`, `database` and `latency_ms`, or `503` when the database query fails.
- **UI walkthrough in CI**: the Playwright loop now covers the health endpoint as well as the full student → organizer → counselor loop, bulk verification and the terms/birthday gate.

### Verification
- `tsc --noEmit`, `eslint` and `next build` clean.
- `npm run test:db` 77/77; `npm run test:ui` passes (15 steps); `npm run test:a11y` 10/10 pages; local health returns `{ ok: true, database: "ok" }`.

## 0.2.0 — 2026-10-22

Community impact, judge demo mode, check-in trust and a pilot program.

### Added
- **Community impact map** (`/impact`): aggregate verified hours by cause, month, organization and event, with a public map and "causes still waiting for hours"; backed by the `impact_summary()` RPC and no student identities.
- **Live demo** (`/demo`): one-click student and organizer demo accounts, a populated dashboard/passport, a verified `IMP-DEMO2026ABCD` code, a pending approval, and demo-record labeling on `/verify`.
- **Check-in trust layer**: optional device location becomes a distance from the event (coordinates are never stored), plus an event-window flag; the organizer sees "42 m from the event" or "outside event window".
- **Pilot program** (`/pilot`, `/pilot/guide`): an insert-only request form, a printable one-page guide, and `PILOT.md` outreach playbook.
- `npm run test:a11y` (axe-core WCAG 2.1 A/AA) and CI jobs for the database suite and accessibility gate.
- `npm run seed:demo` and three new migrations.

### Changed
- The organizer approval queue now appears before stats, trends and attendance.
- The landing hero no longer shows "Hour logs approved 0"; the example code is real and links to `/verify/IMP-DEMO2026ABCD`.
- Privacy and safety copy now distinguish "Near me" (device-only) from optional check-in location (distance stored, coordinates not).
- The demo organization is unverified, matching the public disclosure that demo organizers are fictional.

## 0.1.0 — 2026-10-21

First release of ImpactMap, a student volunteer-hours tracker.

### Core loop
- Map of local events with category, text and distance filters, plus a "Near me" sort and a "Within 3 mi" filter
- One-tap join with capacity enforcement
- Per-event QR check-in that records attendance separately from applications (walk-ins included, scans idempotent)
- Student hour logging; only the event's organizer can approve
- `IMP-` verification codes issued on approval, checkable at `/verify` with no account
- Bulk verification for counselors (up to 200 codes per request)
- Printable counselor report with a QR code per entry
- Hours goal with progress tracking
- Shareable public service record

### Privacy and safety
- 13+ only; guardian name, email and consent for ages 13–15
- Date of birth, email, location, bio, skills and availability protected in the database, not just the UI
- Availability visible only to its owner
- Students cannot verify their own hours or make themselves platform admins
- Data export and account deletion from the profile page
- Public `profiles` reads limited to name and hours goal

### Product surface
- Event weather outlook (Open-Meteo)
- "Near the event" card from OpenStreetMap/Overpass
- Organizer-declared facilities (restrooms, drinking water, and similar)
- PWA manifest + service worker
- Legal pages: privacy, safety, terms, accessibility, attributions

### Verification
- `npm run test:db` — database and security suite
- `npm run test:ui` — Playwright student → organizer → counselor walkthrough
- `tsc --noEmit`, `eslint` and `next build` clean
