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

        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) are an agreement between you and ImpactMap. Please
          read them along with our <Link href="/privacy">Privacy Policy</Link>, our{' '}
          <Link href="/safety">student safety rules</Link>, and our{' '}
          <Link href="/accessibility">accessibility statement</Link>. ImpactMap is a student project, and
          these Terms describe how the service actually works.
        </p>

        <h2>1. Acceptance</h2>
        <p>
          By creating an account or signing in to ImpactMap, you agree to these Terms and to our use of the
          information you provide to run the volunteer event platform. If you do not agree, please do not use
          ImpactMap.
        </p>

        <h2>2. Eligibility and guardian consent</h2>
        <p>
          You must be at least 13 years old to use ImpactMap. If you enter a date of birth under 13, sign-up
          is refused and the session is ended. If you are 13&ndash;15 (under 16), you must provide a parent or
          guardian&rsquo;s name and email and confirm that they agree before your account is created. If you
          are under 18, you represent that you have your parent or guardian&rsquo;s permission to use
          ImpactMap. Coordinators and organizations are responsible for verifying volunteer eligibility for
          specific roles.
        </p>

        <h2>3. Your account</h2>
        <p>
          You agree to provide accurate account information, including your name and a valid email, and to
          keep your password private. You are responsible for activity on your account. Your date of birth is
          used only to apply our age rules and is never shown to other people or to organizations &mdash; a
          restriction enforced by the database, as described in the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>4. Volunteer participation</h2>
        <p>
          Joining an event through ImpactMap does not create an employment, agency, or independent-contractor
          relationship between you and ImpactMap or between you and any organization. ImpactMap is a
          coordination and record-keeping tool; it does not employ volunteers, does not supervise events, and
          does not run background checks. You are responsible for your own conduct at volunteer activities,
          and the hosting organization is responsible for the activity itself. ImpactMap does not guarantee
          placement in any volunteer role.
        </p>

        <h2>5. Verification codes and approvals</h2>
        <p>
          An event organizer approves the hours you log for their event, and their approval is the source of
          truth for those hours. Verification codes (IMP- codes) are issued by event organizers when they
          approve a volunteer&rsquo;s logged hours &mdash; not by ImpactMap directly. Students cannot create,
          edit, or approve their own hours or codes, and the database enforces this. A public verification
          page lets third parties confirm a code you choose to share, and a counselor can check a list of
          codes at once. ImpactMap records what an organizer approves; it does not independently audit whether
          the hours were actually served, and it does not determine whether a school, program, or employer
          will accept a given record.
        </p>

        <h2>6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Submit false, misleading, or fraudulent information, including hours you did not serve.</li>
          <li>Harass, threaten, or harm other users.</li>
          <li>
            Access, attempt to access, or tamper with accounts, data, or verification codes that are not
            yours.
          </li>
          <li>
            Impersonate ImpactMap, an organizer, a volunteer, or any other person, or misrepresent whose
            hours a code covers.
          </li>
          <li>
            Break, overload, or probe the platform (including scraping and automated attacks), or attempt to
            bypass its security or age rules.
          </li>
          <li>Use ImpactMap for anything unlawful.</li>
        </ul>
        <p>We may suspend or remove accounts and content that violate these Terms.</p>

        <h2>7. Your content and licence</h2>
        <p>
          You keep ownership of the content you put into ImpactMap &mdash; your profile details, event
          listings, and the information you submit. By posting it, you grant ImpactMap a limited, non-exclusive
          licence to store, display, and process that content so the app can function: for example, to show
          your name to an organizer whose event you join, or to display a verification code&rsquo;s details on
          the public verification page. This licence ends when you delete the content or your account, subject
          to the retention notes in the <Link href="/privacy">Privacy Policy</Link>. You are responsible for
          making sure the content you post is accurate and does not infringe anyone else&rsquo;s rights.
        </p>

        <h2>8. Communications</h2>
        <p>
          ImpactMap does not send marketing email and does not run an email marketing list. We do not operate
          an email notification service; information such as approvals, verification status, and security
          notices is shown in the app when you sign in. Where an account confirmation is required to activate
          your login, that comes from our authentication provider. We will not spam you.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          ImpactMap is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any
          kind, whether express or implied, to the fullest extent permitted by law. We do not warrant that the
          service will be uninterrupted or error-free, that any volunteer role will be available or safe, or
          that event listings and organization details provided by third parties are accurate or complete.
          Verified hours reflect an organizer&rsquo;s approval, not an independent audit by ImpactMap. A
          verification record is not an official school, government, or program document, and we cannot
          guarantee that a given school, program, or employer will accept it. ImpactMap is a student project
          and, for that reason, may change or be discontinued; see section 12.
        </p>

        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, ImpactMap and the people who built it will not be liable for
          any indirect, incidental, special, consequential, or punitive damages, or for any loss of data,
          hours, opportunities, or reputation, arising out of or relating to your use of the service.
          ImpactMap is provided free of charge, so our total aggregate liability to you is limited to the
          amount you have paid us, which is zero. Nothing in these Terms excludes liability that cannot be
          excluded under applicable law.
        </p>

        <h2>11. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of New Jersey, United States, without regard to
          its conflict-of-law rules. Any dispute relating to these Terms or to ImpactMap will be brought in
          the state or federal courts located in New Jersey, and you consent to their jurisdiction, unless
          applicable law requires otherwise.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update these Terms. Material changes will be reflected by an updated version date at the top
          of this page. Continued use of ImpactMap after changes means you accept the revised Terms. If we
          ever discontinue ImpactMap, this page is where we would say so.
        </p>

        <h2>13. Contact</h2>
        <p>
          Questions about these Terms: contact your organization coordinator, or reach the ImpactMap team
          through the project&rsquo;s public repository at{' '}
          <a href="https://github.com/heyitsmeyourbudlol-lgtm/impactmap/issues">
            github.com/heyitsmeyourbudlol-lgtm/impactmap
          </a>
          . See also our <Link href="/privacy">Privacy Policy</Link>,{' '}
          <Link href="/safety">student safety rules</Link>, and{' '}
          <Link href="/accessibility">accessibility statement</Link>.
        </p>
      </article>
    </div>
  )
}
