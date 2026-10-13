import Link from 'next/link'

type LogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onDark?: boolean
}

const sizes = {
  sm: { icon: 28, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
}

export default function Logo({ size = 'md', showText = true, onDark = false }: LogoProps) {
  const s = sizes[size]

  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <span
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg viewBox="0 0 24 24" className="w-[58%] h-[58%] text-white" fill="currentColor" aria-hidden>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      </span>
      {showText && (
        <span className={`font-bold tracking-tight ${s.text}`}>
          <span className={onDark ? 'text-white' : 'text-gray-900 dark:text-white'}>Impact</span>
          <span className={onDark ? 'text-emerald-400' : 'text-emerald-700 dark:text-emerald-400'}>Map</span>
        </span>
      )}
    </Link>
  )
}
