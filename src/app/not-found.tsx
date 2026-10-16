import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-emerald-700 dark:text-emerald-400">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">Page not found</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-block mt-6 bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-800 motion-pressable"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
