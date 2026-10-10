import Link from 'next/link'

export const metadata = {
  title: 'Pricing | ImpactMap',
  description: 'Simple pricing for volunteer organizations. Start free, upgrade for verified badges and enterprise features.',
}

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'For small nonprofits and community groups getting started.',
    features: [
      '1 organization profile',
      'Unlimited volunteer events',
      'Coordinator dashboard',
      'Hour & completion verification',
      'Impact Passport (IMP-) credentials',
      'Grant-ready CSV export',
    ],
    cta: 'Start free',
    href: '/auth/signup',
    highlighted: false,
  },
  {
    name: 'Growth',
    price: 'Contact sales',
    description: 'For established nonprofits and schools with multiple coordinators.',
    features: [
      'Everything in Starter',
      'Verified organization badge',
      'Multiple coordinator seats',
      'Coordinator access approval workflow',
      'Priority email support',
      'Custom impact valuation',
    ],
    cta: 'Contact sales',
    href: 'mailto:sales@impactmap.app?subject=Growth%20plan%20inquiry',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For corporations, districts, and multi-site programs.',
    features: [
      'Everything in Growth',
      'SAML / SSO (Okta, Azure AD)',
      'Multi-org rollup dashboard',
      'ESG / CSR export mapping',
      'API access & webhooks',
      'Dedicated success manager',
      'Custom DPA & security review',
    ],
    cta: 'Book a demo',
    href: 'mailto:enterprise@impactmap.app?subject=Enterprise%20demo%20request',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Pricing</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Volunteers always use ImpactMap free. Organizations pay for verification infrastructure, reporting, and enterprise controls.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                tier.highlighted
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl scale-[1.02]'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
              }`}
            >
              <h2 className="text-xl font-bold">{tier.name}</h2>
              <p className={`text-3xl font-bold mt-2 ${tier.highlighted ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {tier.price}
              </p>
              <p className={`text-sm mt-2 ${tier.highlighted ? 'text-indigo-100' : 'text-gray-500'}`}>
                {tier.description}
              </p>
              <ul className={`mt-6 space-y-2 text-sm flex-1 ${tier.highlighted ? 'text-indigo-50' : 'text-gray-600 dark:text-gray-400'}`}>
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`mt-8 block text-center py-3 rounded-xl font-semibold ${
                  tier.highlighted
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500 mt-10">
          All plans include coordinator-verified credentials, public IMP- verification links, and{' '}
          <Link href="/security" className="text-indigo-600 hover:underline">security controls</Link>.
        </p>
      </div>
    </div>
  )
}
