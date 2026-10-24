import Link from 'next/link'
import Logo from '@/components/Logo'

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto border-t border-gray-800">
      <h2 className="sr-only">Footer</h2>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Logo size="sm" onDark />
            <p className="mt-4 text-sm max-w-md leading-relaxed">
              Find local volunteer events, check in by QR code, and earn organizer-verified service hours that counselors can check in seconds.
            </p>
          </div>
          <nav aria-label="Volunteers">
            <p className="text-white font-semibold mb-3 text-sm">Volunteers</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/passport" className="hover:text-emerald-400 transition-colors">My hours</Link></li>
              <li><Link href="/verify" className="hover:text-emerald-400 transition-colors">Check a code</Link></li>
              <li><Link href="/opportunities" className="hover:text-emerald-400 transition-colors">Events</Link></li>
              <li><Link href="/impact" className="hover:text-emerald-400 transition-colors">Community impact</Link></li>
              <li><Link href="/demo" className="hover:text-emerald-400 transition-colors">Live demo</Link></li>
            </ul>
          </nav>
          <nav aria-label="Organizations">
            <p className="text-white font-semibold mb-3 text-sm">Organizations</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/organizations" className="hover:text-emerald-400 transition-colors">Directory</Link></li>
              <li><Link href="/opportunities/new" className="hover:text-emerald-400 transition-colors">Post an event</Link></li>
              <li><Link href="/pilot" className="hover:text-emerald-400 transition-colors">Pilot program</Link></li>
            </ul>
          </nav>
          <nav aria-label="Legal and trust">
            <p className="text-white font-semibold mb-3 text-sm">Legal &amp; Trust</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/safety" className="hover:text-emerald-400 transition-colors">Student safety</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link></li>
              <li><Link href="/accessibility" className="hover:text-emerald-400 transition-colors">Accessibility</Link></li>
              <li><Link href="/security" className="hover:text-emerald-400 transition-colors">Security</Link></li>
              <li><Link href="/attributions" className="hover:text-emerald-400 transition-colors">Attributions</Link></li>
              <li><Link href="/auth/login" className="hover:text-emerald-400 transition-colors">Sign in</Link></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} ImpactMap · Verified service hours for students, schools, and nonprofits
        </div>
      </div>
      <span aria-hidden="true" className="hidden">
        <a href="/api/security/canary" rel="nofollow" tabIndex={-1}>Security canary</a>
      </span>
    </footer>
  )
}
