import Link from 'next/link'

export const metadata = {
  title: 'The problem ImpactMap solves | ImpactMap',
  description:
    'Why paper service-hour forms fail, who ImpactMap helps, what the app does today, and what it does not do yet — a student project for the Congressional App Challenge.',
}

const FACTS = [
  {
    figure: '$36.14',
    label:
      'the value of one volunteer hour in 2025, per Independent Sector and the Do Good Institute',
  },
  {
    figure: '34.1%',
    label:
      'of 16 and 17 year olds formally volunteered in 2023 — a higher share than any other age group that survey measures',
  },
  {
    figure: '372:1',
    label:
      'students per school counselor in 2024–25, well above the 250:1 ratio ASCA recommends',
  },
]

const AUDIENCE = [
  {
    title: 'Students — especially those without a car or a smartphone',
    body:
      'ImpactMap runs in a web browser, so there is nothing to install and it works on a school Chromebook or a library computer. Events can be sorted by distance from you, so a student who cannot drive can pick something they can actually get to. It never asks for a phone number, an ID document or a home address.',
  },
  {
    title: 'Event organizers',
    body:
      'Post an event in about a minute, print the check-in QR code for the sign-in table, and approve logged hours with one tap afterwards. No forms to collect, sign, scan or chase — and each approval is signed with the organizer’s own account, so it is worth something.',
  },
  {
    title: 'School counselors',
    body:
      'Check a code without creating an account, without a login, and without calling the organizer to ask whether the hours are real. ASCA’s 2025 survey of 6,238 school counselors found they spend an average of 13% of their time on non-school-counseling tasks, and 59% call being assigned inappropriate duties a serious challenge. Verifying a code is one box on a web page.',
  },
]

const DOES = [
  {
    title: 'A map of local events',
    body:
      'Every open event near you on a map, with search and cause filters. Browsing needs no account at all.',
  },
  {
    title: 'One-tap join',
    body: 'Find an event you can get to and tap Join. No application essay, no approval queue.',
  },
  {
    title: 'QR check-in that records attendance',
    body:
      'Each event has its own check-in QR code that the organizer prints for the sign-in table. Scanning it records that the student showed up. Scanning twice just says “already checked in”, and only the student and that event’s organizers can see it.',
  },
  {
    title: 'Hour logging with one-tap organizer approval',
    body:
      'After the event the student logs the hours and the organizer taps once to approve — no signature to collect. Students cannot approve their own hours: the database rules refuse it, not just the interface.',
  },
  {
    title: 'An IMP- verification code for every approval',
    body:
      'Each approved entry produces a code like IMP-7C41A9E2B0D3 showing the student’s name, the event, the date, the hours and who approved them. A counselor can look it up at /verify without an account.',
  },
  {
    title: 'Bulk code checking for a whole class',
    body:
      'Paste up to 200 codes at once and get a single table showing which ones are verified and which are not — so a counselor can process a whole honor society in one pass.',
  },
  {
    title: 'A printable counselor report',
    body:
      'One page per student listing every verified entry, the organizer who approved it, and a QR code for each one. Print it or save it as a PDF.',
  },
  {
    title: 'An hours goal',
    body:
      'Students set the target their school asks for — 40 hours for NHS, for example — and watch it fill as hours are approved.',
  },
  {
    title: 'Reachable without a car',
    body:
      'Tap “Near me” and filter to events within a short walk, so a student without a ride can pick something they can actually get to.',
  },
  {
    title: 'A weather flag and what is nearby',
    body:
      'Each in-person event shows a rain, wind or heat flag for its date, the cafés and transit stops within an 800 m walk, and the facilities the organizer declares — restrooms, drinking water and the like.',
  },
  {
    title: 'Your availability, kept private',
    body:
      'Mark the days and parts of the day you can usually volunteer. Only you can see it — it is never shown to organizers or other students.',
  },
]

const DOES_NOT = [
  {
    title: 'No real pilot group yet',
    body:
      'ImpactMap has not been used by a real honor society, club or library. The full loop works end to end and is covered by tests, but no group has put it through a school year. That is the honest state of the project today.',
  },
  {
    title: 'The events on the live map are samples',
    body:
      'The five events in Edison, New Jersey are demo listings from fictional organizers, placed at real public locations so the map is not empty on a first visit. They are deliberately not marked as verified organizers, and the join counts on them are honest zeros.',
  },
  {
    title: 'Social sign-in is not switched on',
    body:
      'Students create an account with an email address and a password. Google, Apple and Microsoft sign-in are built but not enabled, so they are not offered.',
  },
  {
    title: 'Guardian consent is an attestation, not a verified email',
    body:
      'Students under 16 enter a parent or guardian’s name and email and confirm that they agree before the account is created. ImpactMap does not email that guardian to double-check.',
  },
  {
    title: 'It does not connect to a school’s records',
    body:
      'An approval comes from the adult who ran the event, not from a school registrar. ImpactMap replaces the paper form and the phone call, not the school’s own judgement.',
  },
]

const SOURCES = [
  {
    title: 'Value of Volunteer Time',
    publisher: 'Independent Sector, with the Do Good Institute at the University of Maryland',
    note:
      'The current estimate of the value of a volunteer hour is $36.14 for 2025, announced 21 April 2026 — a 3.9% increase over the previous year, published each April during National Volunteer Week. Independent Sector notes the 2025 figure is based on preliminary wage data, and that it is a national average rather than the worth of any individual’s time.',
    url: 'https://independentsector.org/research/value-of-volunteer-time/',
  },
  {
    title: 'U.S. Volunteerism Rebounding After COVID-19 Pandemic',
    publisher: 'U.S. Census Bureau, with AmeriCorps (2023 Civic Engagement and Volunteering Supplement)',
    note:
      '28.3% of the U.S. population age 16 and over — 75.7 million people — formally volunteered through an organization between September 2022 and September 2023, serving 4.99 billion hours. The median volunteer served 24 hours in the year; the mean was 70 hours, down from 96.5 hours in 2017.',
    url: 'https://www.census.gov/library/stories/2024/11/civic-engagement-and-volunteerism.html',
  },
  {
    title: '2017–2023 CEV Findings: National Rates of All Measures by Demographics',
    publisher: 'AmeriCorps Open Data (Census Bureau CEV Supplement data)',
    note:
      'The published “Age: 16 to 17” row records a 34.1% formal volunteering rate in 2023 — the highest rate of any age band in the table, above ages 18–24 (22.6%), 25–44 (29.4%) and 45–54 (32.8%). The overall national rate for the same period was 28.3%.',
    url: 'https://data.americorps.gov/dataset/2017-2023-CEV-Findings-National-Rates-of-All-Measu/bhmf-84dy',
  },
  {
    title: 'School Counselor Roles & Ratios',
    publisher: 'American School Counselor Association',
    note:
      'The national student-to-school-counselor ratio was 372:1 for the 2024–2025 school year, against the 250:1 ratio ASCA has recommended since 1965. High school ratios are lower — ASCA reports a range of 195:1 to 224:1 where states report those figures separately — so the 372:1 average is not the ratio of a typical high school.',
    url: 'https://www.schoolcounselor.org/About-School-Counseling/School-Counselor-Roles-Ratios',
  },
  {
    title: 'State of the Profession 2025',
    publisher: 'American School Counselor Association (survey of 6,238 school counselors, October 2025)',
    note:
      'Respondents reported spending an average of 13% of their time on non-school-counseling tasks, and 59% rated “being assigned inappropriate duties” as extremely challenging or challenging.',
    url: 'https://www.schoolcounselor.org/getmedia/9cbe8458-a707-401e-9e08-831faf057e00/2025-state-of-the-profession.pdf',
  },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-gray-950 to-gray-950" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-16 lg:py-20">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider motion-fade-in-up">
            Congressional App Challenge · student project
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] motion-fade-in-up motion-delay-1">
            Volunteer hours are tracked on paper.
            <span className="block text-emerald-400 mt-2">ImpactMap makes them verifiable.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed motion-fade-in-up motion-delay-2">
            This page is the whole argument in about ninety seconds: the problem, who it helps, what
            the app actually does today, and what it honestly does not do yet.
          </p>

          <dl className="mt-12 grid gap-8 sm:grid-cols-3 motion-fade-in-up motion-delay-3">
            {FACTS.map((fact) => (
              <div key={fact.figure}>
                <dt className="text-3xl font-bold text-emerald-400">{fact.figure}</dt>
                <dd className="mt-2 text-sm text-gray-400 leading-relaxed">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">The problem</h2>
          <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Right now, volunteer hours live on paper: a form gets printed, signed at the event, and
            handed to a school counselor weeks later. Forms get lost in backpacks and lockers,
            signatures get filled in afterwards — sometimes by the student — and a counselor has no
            practical way to confirm that the work ever happened.
          </p>
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
            Schools, honor societies and scholarships all ask for proof of service, and paper cannot
            give it. That is why the most important feature in ImpactMap is the one a student cannot
            fake: an approval signed by the organizer’s own account, turned into a code a counselor
            can check in a browser, with no account and no phone call.
          </p>
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
            Volunteering is not a marginal activity — 28.3% of Americans age 16 and over, 75.7
            million people, formally volunteered in a single year — and Independent Sector values
            that hour of work at $36.14. Nearly all of it is still documented with a pen.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Who this helps</h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            Three groups feel the paper problem, and each one loses something different: time,
            trust, or both.
          </p>
          <div className="mt-8 space-y-4">
            {AUDIENCE.map((group) => (
              <section
                key={group.title}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6"
              >
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  {group.title}
                </h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {group.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            What ImpactMap does today
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            These are built, working features — not a roadmap. Each one below exists in the app a
            judge can open right now.
          </p>
          <ul className="mt-8 space-y-4">
            {DOES.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Privacy is enforced in the database rather than the interface: another user cannot read
            a student’s email or birthday, and only an event’s organizer can approve hours for that
            event.{' '}
            <Link
              href="/safety"
              className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              How we protect students →
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            What ImpactMap does not do yet
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            An overstated claim is the fastest way to lose a judge, so here is the other half of the
            picture.
          </p>
          <ul className="mt-8 space-y-4">
            {DOES_NOT.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">About this project</h2>
          <p className="mt-6 text-gray-700 dark:text-gray-300 leading-relaxed">
            ImpactMap is a student project, built for the Congressional App Challenge. It is not a
            company and it is not for sale.
          </p>
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
            The problem, the features and the design decisions are the student’s. AI coding
            assistants were used to write and debug code, which is disclosed in the entry, and the
            app itself has no AI features. It is built with Next.js, React, TypeScript, Tailwind CSS
            and Supabase (Postgres with row-level security), with Leaflet and OpenStreetMap for the
            map.
          </p>
          <p className="mt-6 text-gray-600 dark:text-gray-400 leading-relaxed">
            The full student → organizer → counselor loop is covered by an automated browser
            walkthrough at phone size, alongside 26 database and security checks — including tests
            that a student cannot approve their own hours and that another user cannot read a
            student’s email or birthday.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/opportunities"
              className="inline-flex items-center rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 font-semibold motion-pressable"
            >
              See the events map →
            </Link>
            <Link
              href="/verify"
              className="inline-flex items-center rounded-xl border border-gray-300 dark:border-gray-700 hover:border-gray-500 text-gray-900 dark:text-white px-6 py-3 font-semibold motion-pressable"
            >
              Check an IMP- code →
            </Link>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Both work without an account, so a judge can look around without signing up.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Where the numbers come from
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
            Every figure on this page comes from one of the five sources below, read directly at the
            source. Nothing here is estimated, rounded up or extrapolated. Sources checked 17
            October 2026.
          </p>
          <ul className="mt-8 space-y-4">
            {SOURCES.map((source) => (
              <li
                key={source.url}
                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{source.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{source.publisher}</p>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {source.note}
                </p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline break-all"
                >
                  {source.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
