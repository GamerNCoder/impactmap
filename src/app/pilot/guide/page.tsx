import Link from 'next/link'
import PrintButton from '@/components/PrintButton'

export const metadata = {
  title: 'Pilot guide | ImpactMap',
  description: 'A one-page guide to running one ImpactMap volunteer event with your group.',
}

const BEFORE = [
  'Pick one real event and one organizer who can approve hours.',
  'Reply to the pilot email; we create the verified organization and organizer account.',
  'Post the event from the organizer account (title, date, place, capacity).',
  'Open the event page and print the check-in QR. Put it at the sign-in table.',
]

const DURING = [
  'Students create an account (13+; guardian consent for 13–15) and join the event.',
  'On arrival they scan the event QR. The page records attendance.',
  'They can optionally tap “Use my location”; only the distance is stored.',
]

const AFTER = [
  'Students log their hours from the dashboard.',
  'The organizer opens Manage → Hours to approve and approves with one tap.',
  'Each approval creates an IMP- code, shown on the student’s passport and printable report.',
  'The counselor opens /verify, enters or scans the code, and sees the event, hours, approver and date.',
]

export default function PilotGuidePage() {
  return (
    <div className="bg-white dark:bg-gray-950 min-h-full print:bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 print:py-0">
        <div className="flex items-center justify-between gap-4 print:hidden">
          <Link href="/pilot" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
            ← Pilot program
          </Link>
          <PrintButton />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white print:text-black">
          ImpactMap pilot guide
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 print:text-black">
          One group, one event, about 15 minutes of setup. The goal is to replace one paper service-hour
          cycle and see whether the counselor can verify it without chasing anyone.
        </p>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">Before the event (10 minutes)</h2>
          <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 print:text-black list-decimal pl-5">
            {BEFORE.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">At the event (2 minutes per student)</h2>
          <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 print:text-black list-decimal pl-5">
            {DURING.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">After the event (5 minutes)</h2>
          <ol className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 print:text-black list-decimal pl-5">
            {AFTER.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </section>

        <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-800 p-5 print:border-gray-400">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">Send back after the pilot</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 print:text-black list-disc pl-5">
            <li>How many students took part and how many hours were approved?</li>
            <li>How long did the organizer spend approving, compared with paper?</li>
            <li>Did the counselor check a code? How long did it take?</li>
            <li>What was confusing, broken or missing? One sentence is enough.</li>
            <li>May we quote the group (name, number of students, hours) on the site?</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white print:text-black">Privacy, in one paragraph</h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 print:text-black leading-relaxed">
            Organizers see a student&rsquo;s name and the hours they approved. Email, birthday, town,
            bio and availability are hidden in the database. Check-in location is optional: the app
            compares it with the event and stores the distance, not the coordinates. Students can
            export or delete their account at any time. The public impact page shows aggregates only.
          </p>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 print:hidden">
          <Link href="/pilot" className="rounded-xl bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-emerald-800">
            Request a pilot
          </Link>
          <Link href="/verify" className="rounded-xl border border-gray-300 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
            Try the counselor view
          </Link>
        </div>
      </div>
    </div>
  )
}
