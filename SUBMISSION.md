# Congressional App Challenge — submission kit

Deadline: **Oct 26, 2026** (confirm on the district page). Live app: https://impactmap.vercel.app

## Short description (paste into entry form)
ImpactMap helps high school students find local volunteer events on a map, check in, and get their hours approved by the organizer with one tap. Every approval creates an IMP- code that a school counselor can check online — no account, no paper forms, no chasing signatures. Students track progress toward a goal (like 40 hours for NHS) and print a counselor-ready report with a QR code per entry.

## Problem it solves
Volunteer hours are tracked on paper forms that get lost, forged, or never signed. Students waste time finding events and chasing signatures; counselors have no easy way to confirm hours are real.

## Tech used
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Postgres with row-level security, auth), Leaflet + OpenStreetMap for the map, Nominatim for address lookup, the `qrcode` library, Vercel hosting. Tested with Playwright (full student → organizer → counselor walkthrough) and 26 database security checks.

## Safety and privacy
- Students under 13 can't sign up; ages 13–15 need a guardian's name, email and consent.
- Other users can't see a student's email or birthday (enforced in the database, not just the UI).
- Students can't approve their own hours; only the event's organizer can.
- Counselors verify codes without an account and see only name, event, date and hours.

## AI-use disclosure (edit to match what you actually did)
> I used AI coding assistants (Anthropic's Claude, via Claude Code) while building ImpactMap. I chose the problem, designed the features and user flow, and decided what to keep and cut. AI helped me write and debug code, write automated tests, and review accessibility and security. I reviewed, ran and tested the code, and I can explain how every part of the app works. The app itself has no AI features.

## Demo video script (~2–3 min, phone-size screen recording + voiceover)
| Time | Screen | Say |
|---|---|---|
| 0:00 | Landing page | "Volunteer hours are tracked on paper. Forms get lost, and counselors can't tell what's real. ImpactMap fixes that." |
| 0:15 | Sign up (student, birthday, guardian fields for 13–15) | "Students sign up in under a minute. Younger students need a guardian's consent." |
| 0:35 | Events map, tap "📍 Near me" | "They find real events near them in Edison on a map." |
| 0:50 | Open Roosevelt Park Fall Cleanup → Join | "One tap to join." |
| 1:00 | Dashboard → Log hours | "After the event, they log their hours." |
| 1:15 | Switch to organizer → Approve hours → "Approve 3h" | "The organizer approves with one tap. No signatures to chase." |
| 1:30 | My hours: verified entry with IMP- code, 40h goal bar | "Each approval creates a verification code, and students see progress toward their goal." |
| 1:45 | Counselor report (printable, QR per entry) | "They can print a counselor report with a QR code for every entry." |
| 2:00 | Signed out → /verify → enter code | "A counselor scans it or types the code — no account needed — and sees it's real." |
| 2:15 | Safety page | "Privacy is built into the database: no one sees a student's email or birthday." |
| 2:30 | Landing page | "ImpactMap: find it, do it, prove it. Thank you." |

Recording tips: use a fresh test account, Chrome device toolbar (iPhone size), hide bookmarks bar, record at 1080p. Delete the test accounts afterward.

## Before submitting
- [ ] Remove production test data (org "Austin Park Friends …", event "Saturday park cleanup", 2 `@example.com` users) — it shows on the public events list.
- [ ] Confirm district (assumed NJ-6) on congressionalappchallenge.us.
- [ ] Record + upload video (YouTube/Vimeo, unlisted is fine).
- [ ] Paste AI-use disclosure.
- [ ] Optional but strongest: a real pilot group (NHS, Key Club, library) with a quote or numbers.
