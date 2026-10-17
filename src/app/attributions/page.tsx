import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Attributions | ImpactMap',
  description:
    'The third-party software, data, and fonts ImpactMap uses, with the actual licences those projects publish.',
}

export default function AttributionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="text-sm text-emerald-700 hover:underline">Home</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert">
        <h1>Attributions</h1>
        <p className="text-sm text-gray-500 not-prose">Last updated: October 15, 2026</p>

        <p>
          ImpactMap stands on a lot of other people&rsquo;s work. This page credits the third-party software,
          data, and fonts the project uses, with the licence each one actually publishes. Licence names and
          versions below were read from the installed packages themselves (each package&rsquo;s{' '}
          <code>package.json</code>) rather than assumed.
        </p>

        <h2>1. Software libraries</h2>
        <ul>
          <li><strong>Next.js</strong> 16.2.9 &mdash; MIT License</li>
          <li><strong>React</strong> and <strong>React DOM</strong> 19.2.4 &mdash; MIT License</li>
          <li><strong>@supabase/supabase-js</strong> 2.108.2 &mdash; MIT License</li>
          <li><strong>@supabase/ssr</strong> 0.12.0 &mdash; MIT License</li>
          <li><strong>Tailwind CSS</strong> 4.3.1 &mdash; MIT License</li>
          <li><strong>@tailwindcss/postcss</strong> 4.3.1 &mdash; MIT License</li>
          <li><strong>Leaflet</strong> 1.9.4 &mdash; BSD 2-Clause &quot;Simplified&quot; License</li>
          <li><strong>qrcode</strong> 1.5.4 &mdash; MIT License</li>
          <li><strong>html5-qrcode</strong> 2.3.8 &mdash; Apache License 2.0</li>
        </ul>

        <h2>2. Map data and tiles</h2>
        <p>
          The event map is rendered with Leaflet using raster tiles from the OpenStreetMap project. Map data
          is &copy; <strong>OpenStreetMap contributors</strong> and is made available under the{' '}
          <strong>Open Database License (ODbL) 1.0</strong>. The map displays this attribution, as the ODbL
          requires.
        </p>
        <p>
          Tiles are fetched from the OpenStreetMap Foundation&rsquo;s tile servers (tile.openstreetmap.org).
          Use of those servers is subject to the OpenStreetMap Foundation&rsquo;s tile usage policy.
        </p>

        <h2>3. Geocoding</h2>
        <p>
          When an organizer posts an event, the address is turned into coordinates using the{' '}
          <strong>Nominatim</strong> search service operated by the OpenStreetMap Foundation
          (nominatim.openstreetmap.org). Geocoding results are derived from OpenStreetMap data and are
          therefore also &copy; OpenStreetMap contributors under the ODbL. Requests are made with an
          identifying user agent and are kept low-volume in line with the published Nominatim usage policy.
        </p>

        <h2>4. Fonts</h2>
        <p>
          The interface uses <strong>Geist</strong> and <strong>Geist Mono</strong>, loaded through Next.js
          Google Fonts. Both are published under the <strong>SIL Open Font License 1.1</strong>. Copyright
          2024 The Geist Project Authors (github.com/vercel/geist-font).
        </p>

        <h2>5. What we could not confirm</h2>
        <p>
          If a component&rsquo;s licence could not be read from the source of truth, it is not listed here
          rather than guessed. Only the projects named above are bundled or loaded directly; they retain the
          copyright of their authors, and the full licence text ships with each package under{' '}
          <code>node_modules</code>.
        </p>

        <h2>6. ImpactMap&rsquo;s own licence</h2>
        <p>
          ImpactMap&rsquo;s own source code is released under the MIT License. See the{' '}
          <code>LICENSE</code> file in the repository and the short summary in <code>NOTICE</code>.
        </p>
      </article>
    </div>
  )
}
