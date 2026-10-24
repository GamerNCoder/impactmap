# ImpactMap — presentation and demo-video script

2026 Congressional App Challenge. Live: https://impactmap.vercel.app · demo: `/demo` ·
Deadline: **Oct 26, 2026, 12:00 pm EDT**. District assumed NJ-6 — confirm before submitting.

Checked against the official 2026 rulebook (1–3 minute video, uploaded **public** to YouTube or
Vimeo, AI use disclosed). The video must include: participant name(s), the app name, the purpose
in one clear sentence, the target audience, the tools and languages used, and a demonstration of
the app working.

---

## The one sentence

> **ImpactMap lets a student find a local service event, check in, and get hours approved by the
> organizer with one tap — producing a code a counselor can verify online in seconds, without an
> account and without exposing student contact details.**

Say it once, early, and do not paraphrase it into a feature list.

## Story spine

- **Relate:** Edison, NJ. Paper service-hour forms get lost or signed without proof, and schools
  run roughly one counselor per 372 students.
- **Glue:** problem → failed status quo → the working loop → proof → what comes next.
- **Interest (the sharp insight):** verified service *without* exposing student identity. The
  trust layer is the idea, not another AI wrapper.
- **Never claim:** a real pilot, a verified unverified organizer, that check-in proves attendance,
  or that the whole app works offline.

---

## A. Demo video — target 2:50, hard stop 3:00

Record at 1080p with Chrome device toolbar (iPhone size) or a clean desktop window. Have
`https://impactmap.vercel.app/demo` open, the demo reset, and a timer visible off-camera.

| Time | Screen and exact action | Say |
|---|---|---|
| 0:00 | Title card, or your face over the landing page | "My name is [Your name], and this is ImpactMap. It lets a student find a local service event, check in, and get hours approved by the organizer with one tap — producing a code a counselor can verify online, without an account." |
| 0:18 | Landing page → scroll to the map | "Schools, honor societies and scholarships require service hours, but most are tracked on paper. Forms get lost, signatures get faked, and counselors — about one for every 372 students — have no fast way to tell what is real." |
| 0:32 | Still on the map; point at an event card | "ImpactMap is built for students in [district], especially students without a car, and for the organizers and counselors who sign off." |
| 0:40 | `/demo` → **Student view** (one click, no signup) | "This is the live demo, signed in as a shared student account with real data. Nine verified hours, one log waiting for approval, and a 40-hour goal." |
| 0:55 | Open **Passport** → point at a verified row, then the report button | "Every approved entry has an IMP- code a counselor can check. This button prints a one-page counselor report with a QR code for each entry." |
| 1:08 | *(optional trim)* Back to passport, open bulk verify once | "A counselor can also paste a whole class's codes and check them in one table." |
| 1:15 | `/demo` → **Organizer view** → **Hours to approve** | "Now the organizer view. This pending two-hour log is real. One tap to approve." |
| 1:25 | Click **Approve 2h**; hold on the issued code | "The code is issued immediately. And the database — not just the interface — refuses self-approval. A code from an unverified organizer is labeled as unverified." |
| 1:40 | Signed out: `/verify/IMP-DEMO2026ABCD` | "Signed out, I open that code. No account needed. The event, date, hours and who approved it. This demo record is clearly labeled as a demo." |
| 1:52 | Scroll the verify page to the limits copy | "The page is honest about limits: a check-in is a signal, not proof, and the code is the organizer's attestation — not ImpactMap's." |
| 2:02 | `/impact` | "The public impact page counts only organizer-approved hours. Groups with fewer than three volunteers are suppressed, and no student is named. You see the impact, not the identities." |
| 2:18 | Back to the events map; show an accessibility badge, then the language switcher | "Events can be filtered to a three-mile radius, straight-line, cards show wheelchair, restroom and sensory access declared by the organizer, and the core volunteer flow works in Spanish. Ten core pages pass an accessibility gate in CI." |
| 2:34 | Quick cut: terminal or CI summary, then landing page | "I built it with Next.js 16, React 19, TypeScript, Tailwind, Supabase Postgres with row-level security, Leaflet and OpenStreetMap, on Vercel. The database suite runs 86 checks in continuous integration." |
| 2:48 | Landing page hero | "ImpactMap: find it, do it, prove it. The demo is at impactmap.vercel.app/demo." |

**If you run long, cut in this order:** the bulk-verify line (1:08) → the three-mile sentence
(2:18) → the "honest about limits" line (1:52). Never cut the name, app name, purpose sentence,
audience, tools, or the approve → verify demonstration.

### Narration word budget

Aim for the words written here: the narration is **~365 words**. At a calm 145 words per minute
that is about 2:30 of speech; the remaining ~20 seconds are clicks, page loads and pauses. Read it
aloud twice with a timer before recording; if you land over 2:55, cut one optional line rather
than speeding up.

---

## B. 60-second cut (classroom, demo day, or a shorter submission)

| Time | Beat | Say |
|---|---|---|
| 0:00 | Problem | "Service hours are required, but they are tracked on paper that gets lost or faked." |
| 0:08 | Purpose | "ImpactMap finds local events, verifies hours with one organizer tap, and gives the counselor a code to check in seconds." |
| 0:18 | Student | Show the demo dashboard: "Nine verified hours and a pending log — no signup." |
| 0:28 | Organizer | Approve 2h: "One tap. The code is issued. The database blocks self-approval." |
| 0:40 | Counselor | `/verify` signed out: "No account. Event, date, hours, approver." |
| 0:50 | Close | "Verified service without exposing student identity. ImpactMap." |

---

## C. Live presentation — 5-minute run of show

Practise this exact path. Every step is one click unless noted.

1. **Landing (30 s).** Read the hero sentence. Point at the map, not the feature cards.
2. **Student demo (60 s).** `/demo` → Student view. Dashboard → Passport → counselor report.
   Say the number of verified hours **after** checking it on screen.
3. **Organizer demo (75 s).** `/demo` → Organizer view. If the pending log is already approved,
   click **Reset the demo data** first, then return to the organizer view. Approve it; pause on
   the code.
4. **Counselor (45 s).** Open `/verify/IMP-DEMO2026ABCD` signed out. Read the demo and unverified
   labels aloud — they show you did not hide the limits.
5. **Impact + trust (45 s).** `/impact`, then `/trust`. Explain the three-volunteer threshold and
   what a code does *not* prove.
6. **Engineering (30 s).** Show CI green and `npm run test:db` 86/86. Mention row-level security
   and the self-approval trigger.
7. **Close (15 s).** One sentence + `/demo`.

**Fallbacks:** if the network drops, switch to the recorded clip or the local build
(`npm run dev`); if the demo data was changed by another visitor, click **Reset the demo data**;
if a login fails, use the e-mail/password account you created for recording, not the shared demo.

---

## D. Submission question answers (draft, first person)

1. **Title.** ImpactMap.
2. **Purpose.** ImpactMap turns one volunteer event into a verified service record: students find
   an event, check in, and log hours; the organizer approves with one tap; a counselor checks the
   resulting code online without an account.
3. **Inspiration.** Paper hour forms. As a student I watched people chase signatures and saw how
   easy it is for a form to be lost or signed without proof — and counselors have no time to call
   every organizer.
4. **Technical difficulty.** The hard part was trust, not the map. I made the database, not the
   interface, enforce the rules: a trigger refuses self-approval, a second-account approval is
   blocked unless the organization is verified, public verification returns a redacted name and no
   free-text notes, and the impact page suppresses groups with fewer than three volunteers. I also
   had to make profile privacy survive column-level grants: the first least-privilege migration
   accidentally granted table-wide `SELECT`, which the test suite caught on a fresh database. I
   added a migration that rebuilds the exact column sets and a detection test that fails if the
   privilege returns.
5. **What I learned.** A verification feature is only as good as what it refuses to show. Most of
   my time went into limits, labels and tests — not new screens. I also learned to test against a
   freshly reset database, because privileges and seed data drift from the code.
6. **2.0.** A real pilot with one school group; verified-organizer onboarding instead of a label;
   guardian consent by verified e-mail rather than attestation; and a native share sheet for the
   code. The full offline and full translation claims stay out until they are true.

---

## E. Judge Q&A — short answers

- **"Is this just an AI wrapper?"** No. The app has no runtime AI features. The value is the trust
  layer: organizer-issued codes, database-enforced approval rules, and k-anonymous public impact.
- **"Can a student approve their own hours?"** No. A database trigger blocks the update; the UI is
  not the guard. A second account in the same unverified organization is blocked too.
- **"What stops a fake organizer?"** Nothing fully, and the app says so. Unverified organizations
  are labeled everywhere a code appears, and `/trust` states the code is the organizer's
  attestation, not a background check.
- **"Does check-in prove attendance?"** No. It is a signal. Distance is computed only when the
  student chooses to share a location, the coordinates are discarded, and the UI never calls it
  proof.
- **"How is student privacy protected?"** Row-level security plus column grants: other signed-in
  users cannot read e-mail, birthday, location, bio, availability or the admin flag. The public
  impact page has no identities and suppresses small groups.
- **"What about students without a phone or car?"** It is a web app with no install; events can be
  filtered to a three-mile radius, straight-line; the QR has a copyable URL fallback; the volunteer
  path works with a keyboard and a screen reader.
- **"What did you use AI for?"** Use the disclosure below, verbatim.
- **"What does not work yet?"** No real pilot group, social sign-in is built but disabled, guardian
  consent is an attestation, and full offline/full translation are explicitly not claimed.

---

## F. Recording checklist

- [ ] Reset the demo: `/demo` → **Reset the demo data**. Confirm "1 pending log waiting".
- [ ] Sign out of every account; open `/demo` in a clean window, bookmarks bar hidden.
- [ ] Re-read the live numbers on `/impact` (currently 36 hours, 12 events, 10 organizations); do
      not narrate a number you have not just seen.
- [ ] Confirm `/verify/IMP-DEMO2026ABCD` still shows the demo and unverified labels.
- [ ] 1080p, 30 fps, system audio muted, microphone checked; one dry run with a timer.
- [ ] No secrets, `.env` files, dashboards or API keys on screen.
- [ ] Upload to YouTube or Vimeo as **public** (the 2026 rules require public, not unlisted).
- [ ] Put the link in the submission form; keep the file name `impactmap-demo`.
- [ ] Paste the AI-use disclosure and confirm the district.

## G. AI-use disclosure (paste into the entry; edit to match what you actually used)

> I used AI coding assistants (Claude Code, Command Code and OpenAI Codex) while building
> ImpactMap. I chose the problem, designed the features and user flow, and decided what to keep
> and cut. AI helped me write and debug code, write automated tests, and review accessibility and
> security. I reviewed, ran and tested the code, and I can explain how every part of the app
> works. The app itself has no AI features.

---

## H. Optional slide outline (only if you present with slides)

1. **The form** — a photographed paper hour form; "this is the status quo".
2. **The loop** — find → check in → approve → verify, four icons, one line each.
3. **The insight** — verified service without exposing student identity.
4. **Live demo** — the app, not a screenshot, if the room allows it.
5. **Proof** — CI green, 86 database checks, accessibility gate, production defense audit.
6. **Limits and 2.0** — no pilot yet, unverified organizers are labeled, what comes next.

Keep one idea per slide and no slide longer than 20 seconds.
