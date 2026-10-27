import Link from 'next/link'

export const metadata = {
  title: 'What ImpactMap verifies | ImpactMap',
  description: 'ImpactMap verifies that an organizer approved a volunteer hour record. It does not independently verify identity or attendance.',
}

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">What ImpactMap verifies</h1>
        <div className="mt-6 space-y-5 text-gray-700 dark:text-gray-300">
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white">What the code means</h2>
            <p className="mt-1">
              A verification code means an organization’s coordinator approved that record in ImpactMap:
              the event, date, hours, and supervisor attestation. The database enforces that the person
              whose hours are approved cannot approve them, and that an unverified organization is labeled.
            </p>
            <p className="mt-2">
              An organizer can revoke an approval they issued by mistake. The code stays on record and
              resolves to a clearly marked revoked record; it is excluded from the student’s total and
              the public impact page.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white">What it does not mean</h2>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>It is not government-issued ID or a background check.</li>
              <li>It does not prove the student was physically present; check-in is self-reported.</li>
              <li>An unverified organizer is still an organizer’s attestation, not ImpactMap’s endorsement.</li>
              <li>The student’s name is shown because the code is a bearer credential; share it only with your school.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-semibold text-gray-900 dark:text-white">For counselors</h2>
            <p className="mt-1">
              Check the organization’s verified badge, the event, the date/hours, and the supervisor name.
              If anything is inconsistent, ask the student for the organizer’s contact and confirm directly.
            </p>
          </section>
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-emerald-700 dark:text-emerald-400 hover:underline">
          ← Back to ImpactMap
        </Link>
      </div>
    </div>
  )
}
