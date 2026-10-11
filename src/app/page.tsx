import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EventCard from "@/components/EventCard";
import { getUserCommitmentScore } from "@/lib/commitment-data";
import CommitmentBadge from "@/components/CommitmentBadge";
import { formatImpactValue } from "@/lib/impact-passport";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: featured },
    { count: eventCount },
    { count: memberCount },
    { count: verifiedHoursCount },
  ] = await Promise.all([
    supabase
      .from("opportunities")
      .select("*, organizations(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("opportunities").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("volunteer_hours").select("*", { count: "exact", head: true }).eq("verified", true),
  ]);

  let commitment = null;
  if (user) {
    commitment = await getUserCommitmentScore(user.id);
  }

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-gray-950 to-gray-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                Many schools, honor societies, and scholarships ask for community service hours. ImpactMap finds volunteer events near you, has the organizer sign off on your hours, and gives you one record your counselor can check with a code instead of a paper form.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 motion-fade-in-up motion-delay-3">
                {user ? (
                  <>
                    <Link href="/matches" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-6 py-3 rounded-xl font-semibold motion-pressable">
                      Find events near me
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 border border-gray-700 hover:border-gray-500 text-white px-6 py-3 rounded-xl font-semibold motion-pressable">
                      Your hub
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-6 py-3 rounded-xl font-semibold motion-pressable">
                      Create free account
                    </Link>
                    <Link href="/opportunities" className="inline-flex items-center gap-2 border border-gray-700 hover:border-gray-500 text-white px-6 py-3 rounded-xl font-semibold motion-pressable">
                      Browse events
                    </Link>
                  </>
                )}
              </div>

              {commitment && (
                <div className="mt-8 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <span className="text-sm text-gray-400">Your Commitment Score</span>
                  <CommitmentBadge commitment={commitment} />
                </div>
              )}
            </div>

            {/* Product preview card */}
            <div className="relative hidden lg:block motion-fade-in-scale motion-delay-4">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative bg-gray-900/80 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Impact Passport</span>
                  <span className="text-xs text-gray-500">Verified credential</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">A</div>
                    <div>
                      <p className="font-semibold text-white">Alex Johnson</p>
                      <p className="text-sm text-gray-500">Commitment Score: 72 · Trusted</p>
                    </div>
                  </div>
                  <div className="bg-gray-950 rounded-xl p-4 border border-gray-800">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Community Food Bank</span>
                      <span className="text-emerald-400 font-mono text-xs">IMP-A4F92B1C</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-white font-semibold">12h verified</span>
                      <span className="text-gray-500">{formatImpactValue(12)} impact</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                      <p className="text-2xl font-bold text-emerald-400">94%</p>
                      <p className="text-xs text-gray-500 mt-1">SkillMatch</p>
                    </div>
                    <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                      <p className="text-2xl font-bold text-white">3</p>
                      <p className="text-xs text-gray-500 mt-1">Events joined</p>
                    </div>
                    <div className="bg-gray-950 rounded-lg p-3 border border-gray-800">
                      <p className="text-2xl font-bold text-white">100%</p>
                      <p className="text-xs text-gray-500 mt-1">Show-up rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live stats */}
          <div className="mt-16 grid grid-cols-3 gap-4">
            {[
              { label: "Open events", value: eventCount ?? 0 },
              { label: "Volunteers", value: memberCount ?? 0 },
              { label: "Verified hours", value: verifiedHoursCount ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product pillars */}
      <section id="how-it-works" className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider text-center mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Three steps. One record you can trust.
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-14">
            Paper hour logs get lost and are easy to fake. ImpactMap keeps the whole trail, from sign-up to sign-off, in one place.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Find an event",
                tagline: "Matched to you",
                body: "Pick your interests once. We rank local events by fit, distance, and when you're free, and say why each one is a good match.",
                href: "/matches",
                color: "from-violet-500 to-indigo-500",
              },
              {
                step: "02",
                title: "Log and verify hours",
                tagline: "Signed off on site",
                body: "Check in with the event's QR code, log your hours, and the organizer approves them. No chasing signatures.",
                href: "/dashboard",
                color: "from-emerald-500 to-teal-500",
              },
              {
                step: "03",
                title: "Share your record",
                tagline: "Impact Passport",
                body: "Every verified hour gets an IMP- code. Counselors, honor societies, and scholarship committees can check it in seconds.",
                href: "/passport",
                color: "from-amber-500 to-orange-500",
              },
            ].map((pillar) => (
              <div key={pillar.step} className="group relative bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <div className={`inline-block text-xs font-bold text-white px-2 py-1 rounded-md bg-gradient-to-r ${pillar.color} mb-4`}>
                  {pillar.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pillar.title}</h3>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">{pillar.tagline}</p>
                <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm leading-relaxed">{pillar.body}</p>
                <Link href={pillar.href} className="inline-flex items-center gap-1 mt-5 text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Explore
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schools and nonprofits */}
      <section className="py-20 px-4 bg-indigo-950 text-white">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wider mb-4">For schools and nonprofits</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Less paperwork for counselors. More volunteers for local groups.
            </h2>
            <p className="mt-4 text-indigo-200 leading-relaxed">
              Nonprofits post events and approve hours in one dashboard. Counselors look up a student&apos;s IMP- code instead of reading handwritten logs. Free for everyone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/opportunities/new" className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50">
                Post an event
              </Link>
              <Link href="/verify" className="border border-indigo-400 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-900">
                Check a student&apos;s hours
              </Link>
            </div>
          </div>
          <div className="bg-indigo-900/50 border border-indigo-800 rounded-2xl p-6 space-y-4">
            {[
              'Approve or reject logged hours in one click',
              'QR check-in so hours match who actually showed up',
              'Public verification page for every IMP- code',
              'CSV export of verified hours for school records',
            ].map((item) => (
              <div key={item} className="flex gap-3 text-sm text-indigo-100">
                <span className="text-emerald-400">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center">Your first verified hour</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: 1, title: "Pick your interests", desc: "One-minute setup, then see matches" },
              { n: 2, title: "Sign up for an event", desc: "One tap, and the organizer sees you're coming" },
              { n: 3, title: "Show up and check in", desc: "Scan the QR code at the event" },
              { n: 4, title: "Get hours approved", desc: "Organizer signs off and you get an IMP- code" },
            ].map((step, i) => (
              <div key={step.n} className="relative">
                {i < 3 && <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-emerald-300 dark:bg-emerald-800 -translate-x-1/2 z-0" />}
                <div className="relative bg-white dark:bg-gray-950 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mb-4">{step.n}</div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="text-sm text-gray-500 mt-2">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events feed */}
      <section className="py-20 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Open events near you</h2>
              <p className="text-gray-500 mt-2">Join in one click — or host your own</p>
            </div>
            <Link href="/opportunities/new" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
              + Host an event
            </Link>
          </div>

          {featured && featured.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {featured.map((opp, index) => {
                const delayClass = ['motion-delay-1', 'motion-delay-2', 'motion-delay-3'][index] ?? 'motion-delay-3'
                return (
                <div key={opp.id} className={`motion-fade-in-up ${delayClass}`}>
                <EventCard
                  id={opp.id}
                  title={opp.title}
                  category={opp.category}
                  location={opp.location}
                  remote={opp.remote}
                  organizationName={(opp.organizations as { name: string } | null)?.name}
                  volunteersNeeded={opp.volunteers_needed}
                  volunteersCount={opp.volunteers_count}
                  startDate={opp.start_date}
                />
                </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No events yet — be the first host.</p>
              <Link href="/opportunities/new" className="inline-block mt-4 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700">
                Post an event
              </Link>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/opportunities" className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700">
              View all events
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-emerald-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Make your hours count</h2>
          <p className="text-emerald-100 text-lg mb-8">
            Free for students. Find an event this weekend and have verified hours by Monday.
          </p>
          <Link href={user ? "/matches" : "/auth/signup"} className="inline-block bg-white text-emerald-700 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors">
            {user ? "See your matches" : "Start for free"}
          </Link>
        </div>
      </section>
    </div>
  );
}
