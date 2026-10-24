import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import { DEMO_VERIFICATION_CODE, demoEnabled } from "@/lib/demo";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "1", title: "Find an event", body: "See volunteer events near you on a map. Join with one tap." },
  { n: "2", title: "Check in & volunteer", body: "Scan the event's QR code when you arrive, then do the work." },
  { n: "3", title: "Log your hours", body: "Afterwards, log your time. The organizer approves it with one tap." },
  { n: "4", title: "Share one code", body: "Each approval creates a code. Your counselor checks it online, no paper forms." },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: upcoming }, { count: eventCount }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*, organizations(name, verified)")
      .eq("status", "open")
      .order("start_date", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const demo = demoEnabled();

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-gray-950 to-gray-950" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-6 motion-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Service hours for students
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] motion-fade-in-up motion-delay-1">
              Find service hours.
              <span className="block text-emerald-400 mt-2">Get them verified.</span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-lg leading-relaxed motion-fade-in-up motion-delay-2">
              Schools, honor societies and scholarships ask for service hours, but paper forms get lost and signatures can be faked.
              ImpactMap finds events near you, has the organizer approve your hours, and gives you codes your counselor can check in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 motion-fade-in-up motion-delay-3">
              <Link href="/opportunities" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-6 py-3 rounded-xl font-semibold motion-pressable">
                See events near me →
              </Link>
              {user ? (
                <Link href="/dashboard" className="inline-flex items-center border border-gray-700 hover:border-gray-500 text-white px-6 py-3 rounded-xl font-semibold motion-pressable">
                  Log my hours
                </Link>
              ) : (
                <Link href="/auth/signup" className="inline-flex items-center border border-gray-700 hover:border-gray-500 text-white px-6 py-3 rounded-xl font-semibold motion-pressable">
                  Create free account
                </Link>
              )}
              {demo && !user && (
                <Link href="/demo" className="inline-flex items-center border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 px-6 py-3 rounded-xl font-semibold motion-pressable">
                  Try the live demo
                </Link>
              )}
            </div>
            {demo && !user && (
              <p className="mt-3 text-xs text-gray-400 motion-fade-in-up motion-delay-3">
                No signup. Look at the student view, then approve a log as the organizer.
              </p>
            )}
            <dl className="mt-10 flex gap-10 text-sm">
              <div>
                <dt className="text-gray-400">Open events</dt>
                <dd className="text-2xl font-bold">{eventCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Counselor lookup</dt>
                <dd className="text-base font-semibold text-emerald-300">No account needed</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur motion-fade-in-up motion-delay-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Counselor view</p>
            <Link
              href={`/verify/${DEMO_VERIFICATION_CODE}`}
              className="mt-3 block font-mono text-lg hover:text-emerald-300 transition-colors"
            >
              {DEMO_VERIFICATION_CODE}
            </Link>
            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="font-semibold text-emerald-300">✓ Hours verified</p>
              <p className="text-sm text-gray-300 mt-1">Demo Student · 3 hours · Roosevelt Park Trail Cleanup</p>
              <p className="text-xs text-gray-400 mt-1">Approved by the event organizer</p>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              This demo code works.{' '}
              <Link href={`/verify/${DEMO_VERIFICATION_CODE}`} className="text-emerald-300 underline underline-offset-2">
                Open it with no account →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How it works</h2>
          <ol className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-emerald-700 text-white font-bold">{s.n}</span>
                <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {upcoming && upcoming.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Coming up</h2>
              <Link href="/opportunities" className="text-emerald-700 dark:text-emerald-400 font-semibold">See the map →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {upcoming.map((opp) => {
                const org = opp.organizations as { name: string; verified: boolean } | null;
                return (
                  <EventCard
                    key={opp.id}
                    id={opp.id}
                    title={opp.title}
                    category={opp.category}
                    location={opp.location}
                    remote={opp.remote ?? false}
                    organizationName={org?.name}
                    verified={Boolean(org?.verified)}
                    volunteersNeeded={opp.volunteers_needed ?? undefined}
                    volunteersCount={opp.volunteers_count ?? 0}
                    startDate={opp.start_date}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="bg-gray-950 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Community impact</p>
            <h2 className="mt-2 text-3xl font-bold">See the impact, not just the events.</h2>
            <p className="mt-2 text-gray-400 max-w-2xl leading-relaxed">
              Verified hours by cause, month and neighborhood — built only from organizer-approved
              logs, with no student names attached.
            </p>
          </div>
          <Link
            href="/impact"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 px-6 py-3 font-semibold motion-pressable"
          >
            Open the impact map →
          </Link>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-950 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">For students</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Set your hours goal, watch your progress, and print one report with every verified hour.</p>
          </div>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">For organizers</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Post an event in a minute, put up a check-in QR, and approve hours with one tap.</p>
            <Link href="/opportunities/new" className="inline-block mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Host an event →</Link>
          </div>
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white">For counselors</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Check any code without an account and see who approved the hours and when.</p>
            <Link href="/pilot" className="inline-block mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Run a pilot at your school →</Link>
          </div>
        </div>
        <p className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 text-sm text-gray-600 dark:text-gray-400">
          Built for teens: no private messaging, private contact details, and parent consent for under-16s.{" "}
          <Link href="/safety" className="font-semibold text-emerald-700 dark:text-emerald-400">How we protect students →</Link>
        </p>
      </section>
    </div>
  );
}
