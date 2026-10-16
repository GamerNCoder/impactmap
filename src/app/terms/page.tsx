import Link from 'next/link'
import Logo from '@/components/Logo'
import { TERMS_LAST_UPDATED } from '@/lib/terms'

export const metadata = {
  title: 'Terms & Conditions | ImpactMap',
  description: 'Terms and conditions for using ImpactMap.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/auth/signup" className="text-sm text-emerald-700 hover:underline">
            Back to sign up
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert prose-headings:font-bold">
        <h1>Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-500 not-prose">Last updated: {TERMS_LAST_UPDATED}</p>

        <h2>1. Acceptance</h2>
        <p>
          By creating an account or signing in to ImpactMap, you agree to these Terms &amp; Conditions
          and to our use of the information you provide to operate the volunteer event platform.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old to use ImpactMap. If you are under 18, you represent that
          you have permission from a parent or guardian. Coordinators and organizations are responsible
          for verifying volunteer eligibility for specific roles.
        </p>

        <h2>3. Your account</h2>
        <p>
          You agree to provide accurate account information, including your name and a valid email. Your date of
          birth is used only to apply our age rules and is never shown to other people or to organizations.
        </p>

        <h2>4. Volunteer participation</h2>
        <p>
          Joining an event through ImpactMap does not create an employment relationship. You are responsible
          for your conduct at volunteer activities. An event organizer approves the hours you log for their event.
        </p>

        <h2>5. Verified hours</h2>
        <p>
          Verification codes are issued by event organizers when they approve a volunteer&rsquo;s logged hours, not by
          ImpactMap directly. Public verification pages let third parties confirm a code you choose to share.
          Students cannot approve their own hours.
        </p>

        <h2>6. Acceptable use</h2>
        <p>
          You may not misuse the platform, submit false information, harass other users, or attempt to
          access accounts or data that are not yours.
        </p>

        <h2>7. Communications</h2>
        <p>
          We send only account-related messages, such as confirming your email. We do not send marketing email.
        </p>

        <h2>8. Disclaimer</h2>
        <p>
          ImpactMap is provided &ldquo;as is.&rdquo; We do not guarantee placement in any volunteer role or
          the accuracy of third-party organization listings.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update these terms. Material changes will be reflected by an updated version date.
          Continued use after changes constitutes acceptance of the revised terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about these terms: contact your organization coordinator or reach the ImpactMap team
          through the platform. See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </article>
    </div>
  )
}
