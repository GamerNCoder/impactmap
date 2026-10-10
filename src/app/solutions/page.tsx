import Link from 'next/link'

export const metadata = {
  title: 'For Organizations | ImpactMap',
  description: 'Verified volunteer management, Impact Passport credentials, and grant-ready reporting for nonprofits, schools, and corporate CSR teams.',
}

export default function SolutionsPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <section className="bg-gray-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-4">For organizations</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Volunteer proof your funders can audit.
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl">
            ImpactMap gives nonprofits, schools, and employers a coordinator dashboard to verify hours, issue IMP- credentials, and export grant-ready impact reports — with a full audit trail.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/opportunities/new" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold">
              Start free trial
            </Link>
            <Link href="/pricing" className="border border-gray-700 hover:border-gray-500 px-6 py-3 rounded-xl font-semibold">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Built for institutional buyers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Nonprofits & NGOs',
              body: 'Issue coordinator-verified credentials, track volunteer value at $33.49/hr, and download CSV reports for grant renewals.',
            },
            {
              title: 'Schools & universities',
              body: 'Approve service-learning hours with supervisor attestation. Public IMP- verification links for registrars and counselors.',
            },
            {
              title: 'Corporate CSR & ESG',
              body: 'Measure employee volunteering with audit-grade records. Enterprise SSO and ESG mapping available on Enterprise plans.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-gray-900 rounded-xl border p-6">
              <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border-y">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Coordinator workflow</h2>
          <ol className="space-y-6">
            {[
              'Post events and recruit volunteers with SkillMatch',
              'Review sign-ups and approve coordinator access requests',
              'Verify logged hours and task completions with supervisor attestation',
              'Issue Impact Passport credentials (IMP- codes) volunteers can share',
              'Export grant-ready CSV with verification codes and estimated community value',
            ].map((step, i) => (
              <li key={step} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-gray-700 dark:text-gray-300 pt-1">{step}</p>
              </li>
            ))}
          </ol>
          <Link href="/organizations" className="inline-block mt-8 text-indigo-600 font-semibold hover:underline">
            Browse organizations →
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Security & compliance</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Role-based coordinator access, approval workflows, input sanitization, security headers, and audit logging for verifications and exports.
        </p>
        <Link href="/security" className="text-indigo-600 font-semibold hover:underline">
          Read our security overview →
        </Link>
      </section>

      <section className="bg-indigo-600 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold">Ready to verify volunteer impact?</h2>
          <p className="mt-3 text-indigo-100">Start on the free Starter plan. Upgrade when you need verified org badges, multiple sites, or enterprise SSO.</p>
          <Link href="/auth/signup" className="inline-block mt-6 bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50">
            Create organization account
          </Link>
        </div>
      </section>
    </div>
  )
}
