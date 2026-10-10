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
          <Link href="/" className="text-sm text-emerald-600 hover:underline">Home</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-gray-500 not-prose">Last updated: June 22, 2026</p>

        <h2>1. Who we are</h2>
        <p>
          ImpactMap (&quot;we&quot;, &quot;us&quot;) operates a volunteer matching and credential verification platform
          for individuals and organizations. This policy describes how we handle personal information.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email, phone, date of birth, location, skills, bio</li>
          <li><strong>Volunteer activity:</strong> event sign-ups, logged hours, verification records, reviews</li>
          <li><strong>Organization data:</strong> org name, contacts, coordinator roles, export activity</li>
          <li><strong>Identity verification:</strong> government ID images and selfies (stored securely; reviewed by authorized admins only)</li>
          <li><strong>Usage data:</strong> security audit logs, authentication events</li>
        </ul>

        <h2>3. How we use information</h2>
        <p>We use data to:</p>
        <ul>
          <li>Match volunteers to opportunities (SkillMatch)</li>
          <li>Issue and verify Impact Passport credentials</li>
          <li>Enable coordinators to verify hours and export grant reports</li>
          <li>Prevent fraud and maintain platform security</li>
          <li>Communicate about your account and service updates</li>
        </ul>

        <h2>4. Sharing with organizations</h2>
        <p>
          When you volunteer for an organization on ImpactMap, coordinators may see your profile, hours,
          and verification status. CSV exports may include your name and email for grant reporting —
          organizations are responsible for using this data in compliance with applicable law.
        </p>

        <h2>5. Data retention</h2>
        <p>
          Verified credentials and audit records are retained to support third-party verification.
          ID verification documents are retained only as long as needed for review and compliance, then deleted per our retention schedule.
        </p>

        <h2>6. Your rights</h2>
        <p>
          You may request access, correction, or deletion of your data by contacting us. EU/UK residents may
          exercise GDPR rights. California residents may exercise CCPA rights.
        </p>

        <h2>7. Security</h2>
        <p>
          We use encryption in transit, row-level database security, role-based access controls, and audit logging.
          See our <Link href="/security">Security overview</Link> for details.
        </p>

        <h2>8. Children</h2>
        <p>
          Users must be 13+. Users under 18 should have parental consent. Schools using ImpactMap are responsible
          for obtaining appropriate consents under FERPA and local regulations.
        </p>

        <h2>9. Data Processing Agreement</h2>
        <p>
          Enterprise customers may request a DPA covering subprocessors (including Supabase for database hosting).
          Contact <a href="mailto:privacy@impactmap.app">privacy@impactmap.app</a>.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions: <a href="mailto:privacy@impactmap.app">privacy@impactmap.app</a>
        </p>
      </article>
    </div>
  )
}
