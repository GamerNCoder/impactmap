import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Privacy Policy | ImpactMap',
  description: 'How ImpactMap collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="text-sm text-emerald-700 hover:underline">Home</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-gray-500 not-prose">Last updated: October 15, 2026</p>

        <h2>1. Who we are</h2>
        <p>
          ImpactMap (&quot;we&quot;, &quot;us&quot;) operates a volunteer event and service-hour verification platform
          for students, schools, and organizations. This policy describes how we handle personal information.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li><strong>Account data:</strong> your name, email, password, and date of birth</li>
          <li><strong>Guardian details:</strong> for students aged 13&ndash;15, a parent or guardian name, email, and consent record</li>
          <li><strong>Volunteer activity:</strong> event sign-ups, hours you log, and organizer approvals</li>
          <li><strong>Organization data:</strong> organization name, contact details, and coordinator roles</li>
          <li><strong>Usage data:</strong> security audit logs and authentication events</li>
        </ul>
        <p>
          We do not collect phone numbers, government ID images, or selfies. Your date of birth and guardian
          details are never shown to other volunteers or to organizations.
        </p>

        <h2>3. How we use information</h2>
        <p>We use data to:</p>
        <ul>
          <li>Show you volunteer events and let you join them</li>
          <li>Let an event organizer approve your hours and issue a verification code</li>
          <li>Display a code&rsquo;s details on a public verification page when someone checks it</li>
          <li>Let organizers export a CSV of approved hours for their own records</li>
          <li>Prevent fraud and keep the platform secure</li>
        </ul>

        <h2>4. Sharing with organizations</h2>
        <p>
          When you volunteer for an organization on ImpactMap, that organization&rsquo;s coordinators can see your
          name and the hours you logged for their events. The CSV export contains a volunteer&rsquo;s name, event,
          date, hours, and verification code &mdash; it does not include email addresses. Organizations are
          responsible for using this data in compliance with applicable law.
        </p>

        <h2>5. Data retention</h2>
        <p>
          Verified hours and their verification codes are retained so a counselor or school can confirm them later.
          You can ask us to delete your account and its data at any time.
        </p>

        <h2>6. Your rights</h2>
        <p>
          You may request access, correction, or deletion of your data by contacting us. EU/UK residents may
          exercise GDPR rights. California residents may exercise CCPA rights.
        </p>

        <h2>7. Security</h2>
        <p>
          We use encryption in transit, row-level database security, role-based access controls, and audit logging.
        </p>

        <h2>8. Children</h2>
        <p>
          Users must be at least 13 years old. Students aged 13&ndash;15 need a parent or guardian to consent during
          sign-up. Schools using ImpactMap are responsible for obtaining any additional consents their
          regulations require.
        </p>

        <h2>9. Contact</h2>
        <p>
          Questions about this policy: reach the ImpactMap team through the platform. See also our{' '}
          <Link href="/safety">student safety rules</Link>.
        </p>
      </article>
    </div>
  )
}
