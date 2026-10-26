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
        <p className="text-sm text-gray-500 not-prose">Effective date: October 17, 2026</p>

        <p>
          This policy explains what ImpactMap collects, why, who can see it, and how you can get it back or
          have it deleted. It describes what the app actually does today, including the places where the
          database &mdash; not just the screen &mdash; is what keeps your information private.
        </p>

        <h2>1. Who we are</h2>
        <p>
          ImpactMap (&quot;we&quot;, &quot;us&quot;) is a volunteer event and service-hour verification
          platform for students, schools, and organizations. ImpactMap is a student project, built by a high
          school student as an entry to the Congressional App Challenge. It is not a company, and it is not
          run by a professional legal or data-protection team. We have tried to describe our practices
          honestly and without overclaiming; if anything here is unclear or looks wrong, please tell us using
          the contact details in section 14.
        </p>

        <h2>2. Information we collect</h2>
        <ul>
          <li>
            <strong>Account data:</strong> your name, email address, password (stored only as a hash by our
            authentication provider), and date of birth.
          </li>
          <li>
            <strong>Guardian details:</strong> for students aged 13&ndash;15 (that is, under 16), the name and
            email of a parent or guardian, together with the time you recorded their consent. We do not email
            the guardian to confirm; the consent is an attestation made at sign-up.
          </li>
          <li>
            <strong>Volunteer activity:</strong> the events you join, the hours you log, event check-ins that
            record your attendance (and, if you choose to share it, the approximate distance from the event),
            organizer approvals, and any completed-task (completion) records.
          </li>
          <li>
            <strong>Volunteer availability (optional):</strong> the days and coarse parts of the day you mark
            as available. It exists only to help you spot events that fit; it is visible only to you and is
            never shown to organizers or other users.
          </li>
          <li>
            <strong>Organization data:</strong> for coordinators and organizations, the organization name and
            the contact details you enter for it.
          </li>
          <li>
            <strong>Security and audit logs:</strong> records of security-relevant and authentication events,
            kept so we can detect abuse and keep the platform safe.
          </li>
          <li>
            <strong>First-party product analytics:</strong> events such as page views and feature actions
            (for example, signing up or logging hours). These are sent to our own server and stored in our own
            database, tied to your account when you are signed in. They help us see which parts of the app are
            used. There is no third-party analytics service.
          </li>
        </ul>

        <h2>3. What we do not collect</h2>
        <p>
          We do not ask for or store phone numbers, government-issued ID documents or ID numbers, home
          addresses, or photos or selfies. (A date of birth is collected so the age rules below can be
          applied, but it is not an identity document.) Location is used on your device when you tap
          &quot;Near me&quot; to sort events by distance, and is not sent to us for that. If you choose
          &quot;Use my location&quot; on a check-in, your device coordinates are sent to our server solely
          to calculate the distance to that event; we store the distance, not the coordinates, and the
          organizer sees that distance rather than a map of where you are.
        </p>

        <h2>4. How we use information</h2>
        <ul>
          <li>Show you volunteer events and let you join them.</li>
          <li>Let an event organizer approve your hours and, on approval, issue a verification code.</li>
          <li>
            Display a code&rsquo;s details on a public verification page when someone checks it, and let a
            counselor check a list of codes at once.
          </li>
          <li>Let organizers export a CSV of approved hours for their own records.</li>
          <li>Enforce our age rules and guardian-consent step for younger students.</li>
          <li>Prevent fraud and keep the platform secure.</li>
          <li>Understand, in aggregate, how the app is used, so we can improve it.</li>
        </ul>

        <h2>5. What other people can see</h2>
        <p>
          Most ImpactMap users are teenagers, so the default is that other users see as little as possible.
        </p>
        <ul>
          <li>
            <strong>Other volunteers and the public</strong> can see only your name (and, where hours were
            approved, your verified-hours total). They cannot see your email address, date of birth, guardian
            details, or your bio, skills or general location &mdash; those columns are not readable by anyone
            but you. Your availability is visible only to you.
          </li>
          <li>
            <strong>Organizers</strong> whose events you join can see your name and the hours you logged for
            their events, so they can approve them. They cannot see your email, date of birth, or guardian
            details. A CSV export of approved hours contains a volunteer&rsquo;s name, event, date, hours, and
            verification code &mdash; it does not include email addresses.
          </li>
        </ul>
        <div className="not-prose rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 my-6">
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            <strong>This is enforced by the database, not just the screen.</strong> Our platform stores
            profiles in a Postgres database with row-level security and column-level permissions. Reading
            another user&rsquo;s email, date of birth, guardian name and email, bio, skills, general location
            or availability is blocked at the database level: those columns are simply not granted to other
            users, to organizers, or to anonymous visitors. Even a crafted query
            sent straight to the database cannot return them. The owner reads their own private fields through
            a dedicated function that is scoped to their own account.
          </p>
        </div>

        <h2>6. Public verification and how codes work</h2>
        <p>
          Verified hours are meant to be checked. Anyone &mdash; with no account &mdash; can verify an IMP-
          code at the <Link href="/verify">verify page</Link> or check a whole list of codes at once through
          the counselor tool (up to 200 codes in a single request, rate-limited). Checking a code reveals the
          volunteer&rsquo;s name, the event and organization, the date, the approved hours (or that a task was
          completed), and the name of the supervisor who approved it. Verification codes are issued by event
          organizers when they approve hours; students cannot create or edit their own codes, and the database
          enforces that. Only share a code with people you want to be able to see those details.
        </p>

        <h2>7. Service providers</h2>
        <p>
          We do not sell your data, and we do not share it with advertisers. We rely on a small number of
          service providers to run the app:
        </p>
        <ul>
          <li>
            <strong>Supabase</strong> &mdash; hosts the database, authentication, and file storage. Your
            account and volunteer records live here.
          </li>
          <li>
            <strong>Vercel</strong> &mdash; hosts and serves the website.
          </li>
          <li>
            <strong>OpenStreetMap and Nominatim</strong> &mdash; provide the map tiles shown on the events
            map and turn event addresses into coordinates. When you view the map, your browser requests map
            tiles from OpenStreetMap&rsquo;s tile servers; address lookups are forwarded from our server to
            Nominatim. See our <Link href="/attributions">attributions</Link> for details and licences.
          </li>
        </ul>
        <p>
          Each provider processes data on our behalf for the purpose of running ImpactMap. We do not use
          these providers to build advertising profiles.
        </p>

        <h2>8. Cookies and local storage</h2>
        <p>ImpactMap uses a small amount of browser storage, none of it for advertising:</p>
        <ul>
          <li>
            <strong>Sign-in session cookie</strong> &mdash; set by Supabase so you stay signed in.
          </li>
          <li>
            <strong>Theme preference</strong> &mdash; stored in your browser&rsquo;s local storage, not a
            cookie, so the site remembers light or dark mode.
          </li>
          <li>
            <strong>Terms-acceptance cookie</strong> &mdash; a short-lived cookie set while you complete
            sign-up, and a record on your profile of when you accepted the Terms and which version.
          </li>
          <li>
            <strong>Offline check-in queue</strong> &mdash; if you check in at an event with no signal, the
            check-in is saved in local storage on your device and sent when you are back online.
          </li>
        </ul>
        <p>
          We do not use advertising cookies or third-party trackers, and we do not follow you across other
          websites. There is nothing to turn off for advertising because there is none.
        </p>

        <h2>9. Data retention</h2>
        <p>
          We keep your account and profile data while your account exists. Verified hours and their
          verification codes are kept so that a counselor or school can confirm them later &mdash; that is the
          point of the service. Security and audit logs are kept for as long as needed to keep the platform
          secure. When you delete your account, we delete your profile and the personal data tied to it; a
          limited copy may remain in routine backups until those rotate, and we may keep a minimal record
          where we need it for security or legal reasons.
        </p>

        <h2>10. Children and guardian consent</h2>
        <p>
          ImpactMap is for users aged 13 and older. If a date of birth under 13 is entered, sign-up is
          refused and the session is ended &mdash; no account is kept. Students aged 13&ndash;15 (under 16)
          must provide a parent or guardian&rsquo;s name and email and confirm that their parent or guardian
          agrees before the account is created. Schools and organizations using ImpactMap are responsible for
          obtaining any additional consents their own rules require.
        </p>
        <p>
          We do not claim to be certified under COPPA or any other children&rsquo;s-privacy framework.
          Instead, this is our actual posture: 13+ only, guardian consent recorded for younger teens, and
          sensitive fields kept private at the database level. Our{' '}
          <Link href="/safety">student safety rules</Link> describe the same protections in plain language.
        </p>

        <h2>11. Your rights and how to use them</h2>
        <p>You can, at any time:</p>
        <ul>
          <li>
            <strong>Access and export your data.</strong> The &quot;Your data&quot; section of your{' '}
            <Link href="/profile">profile</Link> lets you download a JSON export of your information.
          </li>
          <li>
            <strong>Correct your data.</strong> Edit your name, bio, and other profile fields on your{' '}
            <Link href="/profile">profile</Link>.
          </li>
          <li>
            <strong>Delete your account.</strong> The &quot;Your data&quot; section of your{' '}
            <Link href="/profile">profile</Link> includes an account-deletion option.
          </li>
          <li>
            <strong>Ask us anything else.</strong> Use the contact route in section 14 if you would rather
            have us help directly.
          </li>
        </ul>
        <p>
          If you live in a place with specific privacy laws &mdash; for example the EU/UK (GDPR) or
          California (CCPA/CPRA) &mdash; you may have additional rights such as the right to object or to
          lodge a complaint with a regulator. We will honor reasonable requests wherever you live.
        </p>

        <h2>12. Security</h2>
        <p>
          We use encryption in transit (HTTPS), row-level database security, column-level grants to hide
          sensitive fields, role-based access controls, and audit logging, and the site is served with
          hardened security headers. Because ImpactMap is a student project, it has not been audited by an
          independent security firm, and we do not hold SOC 2 or any similar certification. We describe what
          is actually in place rather than what we would like to have. See our{' '}
          <Link href="/security">security page</Link> for how to report a vulnerability.
        </p>

        <h2>13. Changes to this policy</h2>
        <p>
          If we change how the app handles data, we will update this policy and its effective date above.
          Continued use of ImpactMap after a change means you accept the updated policy.
        </p>

        <h2>14. Contact</h2>
        <p>
          Questions, corrections, and data requests: use the &quot;Your data&quot; section of your{' '}
          <Link href="/profile">profile</Link> for access, export, and deletion, or reach the ImpactMap team
          through the project&rsquo;s public repository at{' '}
          <a href="https://github.com/GamerNCoder/impactmap/issues">
            github.com/GamerNCoder/impactmap
          </a>
          . See also our <Link href="/safety">student safety rules</Link>,{' '}
          <Link href="/terms">Terms &amp; Conditions</Link>, <Link href="/security">security page</Link>, and{' '}
          <Link href="/accessibility">accessibility statement</Link>.
        </p>
      </article>
    </div>
  )
}
