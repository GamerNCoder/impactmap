import Link from 'next/link'
import Logo from '@/components/Logo'

export const metadata = {
  title: 'Accessibility Statement | ImpactMap',
  description:
    'ImpactMap targets WCAG 2.2 AA. What we have built for accessibility, the limitations we know about, and how to report a barrier.',
}

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="text-sm text-emerald-700 hover:underline">Home</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-10 prose prose-gray dark:prose-invert">
        <h1>Accessibility Statement</h1>
        <p className="text-sm text-gray-500 not-prose">Last updated: October 27, 2026</p>

        <h2>1. Our commitment</h2>
        <p>
          ImpactMap aims to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA. We want
          students, organizers, and school staff to be able to use the platform regardless of how they
          browse &mdash; with a keyboard, a screen reader, a zoomed display, or reduced motion and contrast
          preferences.
        </p>
        <p>
          ImpactMap is a <strong>student project</strong> built for the Congressional App Challenge. It is
          not built by an accessibility team, and this statement is written in good faith rather than as the
          result of a formal audit.
        </p>

        <h2>2. What we have done</h2>
        <ul>
          <li>
            <strong>Semantic structure:</strong> every page uses a real heading hierarchy and landmark
            elements, and the footer carries a screen-reader-only heading so its areas are announced.
          </li>
          <li>
            <strong>Skip link:</strong> a &quot;Skip to content&quot; link is the first focusable element on
            each page and jumps to the main content region.
          </li>
          <li>
            <strong>Visible focus:</strong> interactive elements show a high-contrast emerald focus ring
            when reached by keyboard.
          </li>
          <li>
            <strong>Dark mode:</strong> a light/dark theme follows your operating-system preference by
            default and can be toggled manually.
          </li>
          <li>
            <strong>Reduced motion:</strong> animations are disabled automatically when your device
            requests reduced motion.
          </li>
          <li>
            <strong>Modal focus handling:</strong> dialogs such as the QR scanner move focus in when they
            open, keep keyboard focus inside, close on Escape, and return focus to the control that opened
            them.
          </li>
          <li>
            <strong>Text size:</strong> a text-size control (A− / A+) in the header enlarges text up
            to 200% without losing content, every page reflows to a 320&nbsp;px viewport without
            sideways scrolling, and the choice is remembered on your device.
          </li>
          <li>
            <strong>Live regions:</strong> status updates such as scan progress and result announcements are
            exposed to assistive technology so they are not silent.
          </li>
          <li>
            <strong>Text alternatives:</strong> controls are labelled, and decorative graphics are marked so
            they are ignored by screen readers.
          </li>
        </ul>

        <h2>3. Known limitations</h2>
        <p>We know about the following gaps and are honest that they are not fully solved:</p>
        <ul>
          <li>
            <strong>No independent audit.</strong> We have not commissioned a third-party WCAG 2.2 AA audit
            or an assistive-technology test pass, so conformance is our best effort, not a certified result.
          </li>
          <li>
            <strong>Map interaction.</strong> The event map is a visual canvas. Events are also listed as
            text below the map, but selecting a pin itself is a pointer interaction.
          </li>
          <li>
            <strong>Camera check-in.</strong> QR scanning needs a device camera and permission. A manual
            &quot;enter code&quot; option exists on the verification page as an alternative to scanning.
          </li>
          <li>
            <strong>Long-form typography.</strong> Policy and information pages use utility styling with
            browser defaults rather than a tuned reading scale.
          </li>
        </ul>

        <h2>4. Report a barrier</h2>
        <p>
          If you hit an accessibility problem, please tell us. The fastest route is to open an issue on the
          project repository at{' '}
          <a href="https://github.com/GamerNCoder/impactmap/issues" className="[overflow-wrap:anywhere]">
            github.com/GamerNCoder/impactmap/issues
          </a>
          . Describe the page, what you were trying to do, the assistive technology or browser you use, and
          what happened. Please do not include personal or account details in a public issue.
        </p>
        <p>
          For anything you would rather not post publicly, you can also reach the team through the platform
          itself. See also our <Link href="/security">security disclosure page</Link> and{' '}
          <Link href="/privacy">privacy policy</Link>.
        </p>

        <h2>5. A note on scope</h2>
        <p>
          Because ImpactMap is a student project, fixes may arrive slowly and we cannot promise a response
          time. We will nonetheless read every report and prioritise barriers that block a task entirely.
        </p>
      </article>
    </div>
  )
}
