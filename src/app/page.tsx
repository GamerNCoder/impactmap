import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";

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

  const [{ data: upcoming }, { count: eventCount }, { count: approvedCount }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*, organizations(name, verified)")
      .eq("status", "open")
      .order("start_date", { ascending: true, nullsFirst: false })
      .limit(3),
    supabase.from("opportunities").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("volunteer_hours").select("id", { count: "exact", head: true }).eq("verified", true),
  ]);

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
            </div>
            <dl className="mt-10 flex gap-10 text-sm">
              <div>
                <dt className="text-gray-400">Open events</dt>
                <dd className="text-2xl font-bold">{eventCount ?? 0}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Hour logs approved</dt>
                <dd className="text-2xl font-bold">{approvedCount ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur motion-fade-in-up motion-delay-2">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Counselor view</p>
            <p className="mt-3 font-mono text-lg">IMP-7C41A9E2B0D3</p>
            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="font-semibold text-emerald-300">✓ Hours verified</p>
              <p className="text-sm text-gray-300 mt-1">Alex J. · 3 hours · Roosevelt Park Fall Cleanup</p>
              <p className="text-xs text-gray-400 mt-1">Approved by the event organizer</p>
            </div>
            <p className="text-xs text-gray-400 mt-3">Example. Anyone can check a real code at /verify.</p>
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
                    remote={opp.remote}
                    organizationName={org?.name}
                    verified={Boolean(org?.verified)}
                    volunteersNeeded={opp.volunteers_needed}
                    volunteersCount={opp.volunteers_count}
                    startDate={opp.start_date}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

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
            <Link href="/verify" className="inline-block mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-400">Check a code →</Link>
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
