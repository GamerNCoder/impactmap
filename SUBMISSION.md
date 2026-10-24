# Congressional App Challenge — submission kit

Deadline: **Oct 26, 2026** (confirm on the district page). Live app: https://impactmap.vercel.app

## Short description (paste into entry form)
ImpactMap helps high school students find local volunteer events on a map, check in, and get their hours approved by the organizer with one tap. Every approval creates an IMP- code that a school counselor can check online — no account, no paper forms, no chasing signatures. Students track progress toward a goal (like 40 hours for NHS) and print a counselor-ready report with a QR code per entry. A public impact map shows verified hours by cause and neighborhood without exposing student identities, and a live demo lets anyone try the student and organizer views without signing up.

## Problem it solves
Volunteer hours are tracked on paper forms that get lost, forged, or never signed. Students waste time finding events and chasing signatures; counselors have no easy way to confirm hours are real.

## Tech used
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres with row-level security, auth) with generated, type-safe clients, Leaflet + OpenStreetMap for the map, Nominatim for address lookup, the Overpass API (OpenStreetMap) for the "near the event" card, Open-Meteo for the event weather outlook, the `qrcode` library, Vercel hosting. Tested with Playwright (full student → organizer → counselor walkthrough plus the health endpoint), an axe-core accessibility gate (10/10 pages), and a database security suite (86 checks); both CI jobs are green.

## Safety and privacy
- Students under 13 can't sign up; ages 13–15 need a guardian's name, email and consent.
- Other users can't see a student's email, birthday, bio, skills or town (enforced in the database, not just the UI).
- A student's availability is visible only to the student themselves.
- Students can't approve their own hours; only the event's organizer can.
- Counselors verify codes without an account and see only name, event, date and hours.

## AI-use disclosure (edit to match what you actually did)
> I used AI coding assistants (Claude Code, Command Code and OpenAI Codex) while building ImpactMap. I chose the problem, designed the features and user flow, and decided what to keep and cut. AI helped me write and debug code, write automated tests, and review accessibility and security. I reviewed, ran and tested the code, and I can explain how every part of the app works. The app itself has no AI features.

## Demo video

Full recording script, a 60-second cut, a live run-of-show, submission answers and judge Q&A are
in **`PRESENTATION.md`**.

Official 2026 constraints: **1–3 minutes**, uploaded **public** to YouTube or Vimeo, and the video
must include the participant name(s), the app name, the purpose in one sentence, the target
audience, the tools and languages used, and a working demonstration.

Use the shared demo accounts (`/demo` → Student view, then Organizer view) for the approval step.
The five seeded Edison events have no owner, so hours logged against them cannot be approved; the
demo organizer owns the three demo events and already has one pending 2-hour log, which is the
quickest honest way to show one-tap approval. If a previous visitor already approved it, click
**Reset the demo data** on `/demo` first.

**Production data:** the live site carries the five seeded Edison sample events plus three events from the shared demo organizer, so the map is not empty when a judge clicks the link. The organizers are fictional and unverified; join counts are honest, and the demo student is the only joiner. Everything the video shows for the join → log → approve → verify loop is real application behavior. A judge can also open `/demo` to try the student and organizer views without creating an account; the demo verification code `IMP-DEMO2026ABCD` is labeled as a demo record on `/verify`.

## Before submitting
- [x] Remove production test data (org "Austin Park Friends …", event "Saturday park cleanup", 2 `@example.com` users) — done 2026-10-15 via `supabase db query --linked`.
- [x] Live demo, community impact page, accessibility gate, database suite and CI — done 2026-10-22.
- [x] Engineering finish: generated type-safe Supabase clients (typed RPCs), `/api/health`, UI walkthrough in CI, full local verification — done 2026-10-22.
- [x] Security finish: least-privilege grants restored, fail-closed demo reset, attributed audit rows, production defense audit 11/11 — done 2026-10-24.
- [x] Presentation script: `PRESENTATION.md` (2:50 video, 60-second cut, live run-of-show, submission answers, Q&A) — done 2026-10-24.
- [ ] Confirm district (assumed NJ-6) on congressionalappchallenge.us.
- [ ] Record + upload video — 1–3 minutes, **public** on YouTube or Vimeo, following `PRESENTATION.md`.
- [ ] Paste AI-use disclosure.
- [ ] Optional but strongest: a real pilot group (NHS, Key Club, library) with a quote or numbers. If it happens, update `/about` and add the quote.
