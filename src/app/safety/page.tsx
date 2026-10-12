import Link from 'next/link'

export const metadata = {
  title: 'How we protect students | ImpactMap',
  description: 'The safety and privacy rules built into ImpactMap for teen volunteers.',
}

const RULES = [
  {
    title: 'Ages 13 and up, with a parent for under-16s',
    body: 'Students must be at least 13. Students under 16 add a parent or guardian’s name and email, and confirm that their parent or guardian agrees before the account is created.',
  },
  {
    title: 'Private by default',
    body: 'Your email, birthday and guardian details are visible only to you. Organizers and other users see your name, nothing else. Counselors who check a code see your name, the event, the hours and who approved them.',
  },
  {
    title: 'No private messaging',
    body: 'ImpactMap has no chat or direct messages between adults and students. Everything happens at the event, in person, with other volunteers around.',
  },
  {
    title: 'Verified organizers',
    body: 'New organizations are never verified automatically. The ✓ Verified organizer badge only appears after ImpactMap has checked the group.',
  },
  {
    title: 'Hours you can trust',
    body: 'Only the event’s organizer can approve hours. Students cannot create, edit or approve their own codes. The database enforces this, not just the app.',
  },
  {
    title: 'Less data, less risk',
    body: 'We don’t ask for ID documents, phone numbers or your home address. If you tap “Near me”, your location is only used on your device to sort events by distance. It is never saved.',
  },
]

export default function SafetyPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-emerald-400 text-sm font-semibold uppercase tracking-wider mb-2">Student safety</p>
          <h1 className="text-3xl font-bold">How we protect students</h1>
          <p className="mt-3 text-gray-400">
            Most ImpactMap users are teenagers. These rules are built into the app for every student.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-4">
        {RULES.map((rule) => (
          <section key={rule.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{rule.title}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{rule.body}</p>
          </section>
        ))}

        <section className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 p-6">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Tips for your first event</h2>
          <ul className="mt-3 space-y-2 text-gray-700 dark:text-gray-300 list-disc pl-5">
            <li>Tell a parent or guardian where you&apos;re going and when you&apos;ll be back.</li>
            <li>Bring a friend, and choose events in public places like parks and libraries.</li>
            <li>If something feels wrong, leave, and tell a parent, your school counselor or another adult you trust. In an emergency, call 911.</li>
          </ul>
        </section>

        <p className="text-sm text-gray-500 pt-2">
          See also our <Link href="/privacy" className="underline">Privacy Policy</Link> and{' '}
          <Link href="/terms" className="underline">Terms</Link>.
        </p>
      </div>
    </div>
  )
}
