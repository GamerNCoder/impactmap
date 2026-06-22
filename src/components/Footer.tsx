import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="text-2xl font-bold text-white">ImpactMap</span>
            <p className="mt-3 text-gray-400 max-w-md">
              Connecting volunteers with meaningful opportunities to create lasting change in communities worldwide.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Explore</h3>
            <ul className="space-y-2">
              <li><Link href="/opportunities" className="hover:text-white transition-colors">Opportunities</Link></li>
              <li><Link href="/organizations" className="hover:text-white transition-colors">Organizations</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Sign up</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">Profile</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ImpactMap. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
