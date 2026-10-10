import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Security | ImpactMap',
  description: 'Security controls, audit logging, and compliance posture for ImpactMap.',
}

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/solutions" className="text-sm text-indigo-600 hover:underline">For organizations</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert">
        <h1>Security Overview</h1>
        <p className="text-sm text-gray-500 not-prose">For procurement and IT security reviews</p>

        <h2>Platform architecture</h2>
        <p>
          ImpactMap is built on Next.js with Supabase (PostgreSQL) for data storage. All data access is
          enforced at the database layer via Row Level Security (RLS) policies.
        </p>

        <h2>Access controls</h2>
        <ul>
          <li><strong>Volunteer accounts:</strong> authenticated via email/password or OAuth</li>
          <li><strong>Coordinator access:</strong> approval workflow — no self-serve coordinator join</li>
          <li><strong>Organization roles:</strong> owner, coordinator, viewer with role-checked exports and verification</li>
          <li><strong>Platform admin:</strong> restricted ID verification review and org verification</li>
        </ul>

        <h2>Audit logging</h2>
        <p>Security-sensitive actions are logged including:</p>
        <ul>
          <li>Hour and completion verifications</li>
          <li>Grant report exports</li>
          <li>Coordinator access approvals</li>
          <li>Application accept/decline decisions</li>
          <li>Transfer request lifecycle</li>
        </ul>

        <h2>Application security</h2>
        <ul>
          <li>HTTP security headers (CSP, HSTS, X-Frame-Options, nosniff)</li>
          <li>Input sanitization on all user-generated content</li>
          <li>URL validation for shared links</li>
          <li>Transfer limits and ID verification gates for P2P requests</li>
          <li>Versioned Terms &amp; Conditions with enforced acceptance</li>
        </ul>

        <h2>Identity verification</h2>
        <p>
          Government ID documents are stored in a private storage bucket. Only platform administrators
          can review submissions. Approved verifications issue public IDV- certificate codes without exposing document images.
        </p>

        <h2>Subprocessors</h2>
        <ul>
          <li><strong>Supabase</strong> — database, authentication, file storage</li>
          <li><strong>Vercel</strong> — application hosting</li>
        </ul>

        <h2>Enterprise readiness</h2>
        <p>Available on Enterprise plans:</p>
        <ul>
          <li>SAML / SSO integration</li>
          <li>Custom Data Processing Agreement (DPA)</li>
          <li>Security questionnaire support</li>
          <li>API access with scoped credentials</li>
        </ul>

        <p>
          Contact <a href="mailto:security@impactmap.app">security@impactmap.app</a> for security documentation
          or see our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </article>
    </div>
  )
}
