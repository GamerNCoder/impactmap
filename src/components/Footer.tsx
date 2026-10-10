import Link from 'next/link'
import Logo from '@/components/Logo'

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-auto border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <Logo size="sm" />
            <p className="mt-4 text-sm max-w-md leading-relaxed">
              Verified volunteer infrastructure for individuals and organizations — SkillMatch, Commitment Score, and audit-grade Impact Passport credentials.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Volunteers</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/matches" className="hover:text-emerald-400 transition-colors">SkillMatch</Link></li>
              <li><Link href="/passport" className="hover:text-emerald-400 transition-colors">Impact Passport</Link></li>
              <li><Link href="/opportunities" className="hover:text-emerald-400 transition-colors">Events</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Organizations</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/organizations" className="hover:text-emerald-400 transition-colors">Directory</Link></li>
              <li><Link href="/opportunities/new" className="hover:text-emerald-400 transition-colors">Post an event</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm">Legal &amp; Trust</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link></li>
              <li><Link href="/auth/login" className="hover:text-emerald-400 transition-colors">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} ImpactMap · Verified volunteer infrastructure for nonprofits, schools, and employers
        </div>
      </div>
    </footer>
  )
}
