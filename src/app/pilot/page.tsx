import Link from 'next/link'
import PilotRequestForm from '@/components/PilotRequestForm'

export const metadata = {
  title: 'Pilot program | ImpactMap',
  description:
    'Run one volunteer event with your school, club or library and give students a counselor-verifiable service record.',
}

const STEPS = [
  {
    title: 'We set up the organization',
    body: 'A verified organizer account for your group, with the event and check-in QR ready to go.',
  },
  {
    title: 'You post one event',
    body: 'One real event, a handful of students, and the organizer approval you already do anyway.',
  },
  {
    title: 'Students check in and log hours',
    body: 'They scan the QR at the event, then log their time. You approve each entry with one tap.',
  },
  {
    title: 'A counselor checks the code',
    body: 'Every approval creates an IMP- code. The counselor opens /verify, no account needed, and sees who approved what and when.',
  },
]

export default function PilotPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <section className="bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Pilot program</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight max-w-3xl">
            Bring verified service hours to your school.
          </h1>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl leading-relaxed">
            Run one event with one group. We set up the organization; you post the event, approve the
            hours and hand a counselor one code. Setup is about 15 minutes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pilot/guide"
              className="rounded-xl bg-emerald-500 text-gray-950 px-6 py-3 font-semibold hover:bg-emerald-400 motion-pressable"
            >
              Read the one-page guide →
            </Link>
            <Link
              href="/verify"
              className="rounded-xl border border-gray-700 text-white px-6 py-3 font-semibold hover:border-gray-500 motion-pressable"
            >
              See the counselor view
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What a pilot looks like</h2>
            <ol className="mt-5 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Who it is for</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Honor societies, Key Clubs, service clubs, school counseling offices, public libraries
              and local nonprofits. If a group already tracks service hours on paper, a pilot replaces
              one paper cycle, not your whole year.
            </p>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white">What we ask</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• One real event with at least 3 students</li>
                <li>• One organizer who can approve hours</li>
                <li>• One counselor willing to check a code</li>
                <li>• A short debrief: what worked, what did not</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h2 className="font-bold text-gray-900 dark:text-white">What you get</h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• A verified service record for every student</li>
                <li>• One code a counselor can check without an account</li>
                <li>• A printable report with a QR code per entry</li>
                <li>• No paper forms to collect or chase</li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-6">
            <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Privacy by default</h2>
            <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
              Organizers see a student&rsquo;s name and the hours they approved — not email, birthday,
              town, bio or availability. The database enforces it. Check-in location is optional and
              only the distance is stored, never the coordinates.{' '}
              <Link href="/safety" className="font-semibold underline underline-offset-2">
                Read the safety page →
              </Link>
            </p>
          </section>
        </div>

        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 lg:sticky lg:top-20">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request a pilot</h2>
            <p className="mt-1 mb-5 text-sm text-gray-500 dark:text-gray-400">
              Tell us the group and the event. We&rsquo;ll reply by email.
            </p>
            <PilotRequestForm />
          </div>
        </aside>
      </div>
    </div>
  )
}
