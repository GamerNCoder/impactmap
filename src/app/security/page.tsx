import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Security & Responsible Disclosure | ImpactMap',
  description:
    'How to report a vulnerability in ImpactMap, what is in scope, and a plain description of how the platform protects student data.',
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="text-sm text-emerald-700 hover:underline">Home</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert">
        <h1>Security &amp; Responsible Disclosure</h1>
        <p className="text-sm text-gray-500 not-prose">Last updated: October 15, 2026</p>

        <p>
          ImpactMap handles service records for students, so we take security reports seriously. Please give
          us a fair chance to fix a problem before disclosing it publicly.
        </p>

        <h2>1. How to report a vulnerability</h2>
        <p>
          Report privately through GitHub&rsquo;s Private Vulnerability Reporting on the project repository:
          open{' '}
          <a href="https://github.com/GamerNCoder/impactmap/security/advisories/new">
            github.com/GamerNCoder/impactmap &rarr; Security &rarr; Report a vulnerability
          </a>
          . That channel is private to the maintainers.
        </p>
        <p>
          If you cannot use it, open a minimal public issue at{' '}
          <a href="https://github.com/GamerNCoder/impactmap/issues" className="[overflow-wrap:anywhere]">
            github.com/GamerNCoder/impactmap/issues
          </a>{' '}
          asking for a private channel, and do not include the details of the flaw, any data, or a
          proof-of-concept in the public thread.
        </p>
        <p>A useful report includes:</p>
        <ul>
          <li>What the issue is and where it is (URL or file/route).</li>
          <li>The steps to reproduce it.</li>
          <li>What an attacker could actually do with it.</li>
          <li>Any suggested fix, if you have one, and how you would like to be credited.</li>
        </ul>

        <h2>2. What is in scope</h2>
        <ul>
          <li>The ImpactMap application code in this repository and its hosted Supabase backend.</li>
          <li>Authentication, authorization, and data-exposure flaws &mdash; anything that would let one user see or change another user&rsquo;s data.</li>
          <li>Injection, broken access control, and security-misconfiguration issues.</li>
        </ul>
        <p>Out of scope:</p>
        <ul>
          <li>Third-party services we rely on (for example Vercel, Supabase, OpenStreetMap, or Google Fonts) &mdash; please report those to the vendor.</li>
          <li>Denial-of-service testing, social engineering, physical attacks, and automated scanning that degrades the service.</li>
          <li>Findings from automated tools that are not demonstrated to have real impact.</li>
        </ul>
        <p>
          Please only test against accounts and data you control, and never access, modify, or exfiltrate
          another person&rsquo;s data.
        </p>

        <h2>3. Our commitment</h2>
        <p>
          We will acknowledge your report. We will work to confirm and fix valid issues, keep you informed
          about our progress, and credit you if you would like. ImpactMap is a student project, so we
          cannot offer a bug bounty and we cannot promise a fixed response time &mdash; but every report is
          read by the people who built the app, and student data privacy comes first.
        </p>

        <h2>4. How the platform is protected</h2>
        <p>
          This is a plain description of protections that are actually in place today, not aspirations:
        </p>
        <ul>
          <li>
            <strong>Row Level Security on every table.</strong> Every table in the Supabase database has
            Row Level Security enabled and explicit policies. Access rules are enforced by the database
            itself, not only by the app.
          </li>
          <li>
            <strong>Column-level grants hide sensitive profile fields.</strong> Reading the profiles table
            is revoked for anonymous visitors and for other signed-in users; only non-sensitive columns
            (such as name and avatar) are granted. A volunteer&rsquo;s date of birth, email, bio, town,
            availability, and guardian name, email, and consent are not readable by other users or the
            public &mdash; the owner reads their own record through a dedicated, owner-scoped function.
          </li>
          <li>
            <strong>Students cannot approve their own hours.</strong> When a volunteer logs hours, the
            database forces the entry to be unverified and un-coded. Only a user recognized as a manager of
            that event&rsquo;s organization can update hours to verified and issue a verification code.
          </li>
          <li>
            <strong>Audit logging.</strong> A <code>security_audit_log</code> table records security-relevant
            actions and is itself protected by Row Level Security.
          </li>
          <li>
            <strong>Encryption in transit and hardened headers.</strong> The app is served over HTTPS with
            HSTS, and sends a Content-Security-Policy plus X-Frame-Options (DENY), X-Content-Type-Options
            (nosniff), Referrer-Policy, and Permissions-Policy headers.
          </li>
          <li>
            <strong>Minimal data by design.</strong> ImpactMap does not collect phone numbers, government ID
            images, or selfies. See the <Link href="/privacy">privacy policy</Link> for what is stored.
          </li>
        </ul>

        <h2>5. Related</h2>
        <p>
          <Link href="/privacy">Privacy policy</Link>, <Link href="/safety">student safety</Link>, and{' '}
          <Link href="/accessibility">accessibility statement</Link>.
        </p>
      </article>
    </div>
  )
}
