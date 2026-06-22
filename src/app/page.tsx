import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import OpportunityCard from "@/components/OpportunityCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const { data: featured } = await supabase
    .from("opportunities")
    .select("*, organizations(name)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(3);

  const fallbackFeatured = [
    {
      id: "demo-1",
      title: "Community Food Bank",
      category: "Food Security",
      location: "Downtown",
      remote: false,
      organizationName: "City Food Bank",
    },
    {
      id: "demo-2",
      title: "Youth Mentorship Program",
      category: "Education",
      location: "Multiple Locations",
      remote: true,
      organizationName: "Big Brothers",
    },
    {
      id: "demo-3",
      title: "Environmental Cleanup",
      category: "Environment",
      location: "City Park",
      remote: false,
      organizationName: "Green Earth",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Make a Difference with ImpactMap
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-indigo-100">
            Connect with meaningful volunteer opportunities in your community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/opportunities"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Find Opportunities
            </Link>
            <Link
              href="/auth/signup"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-colors"
            >
              Join as Volunteer
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose ImpactMap?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Wide Range of Opportunities</h3>
              <p className="text-gray-600">Discover volunteer positions across various causes and organizations</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect with Organizations</h3>
              <p className="text-gray-600">Build relationships with nonprofits and community organizations</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Your Impact</h3>
              <p className="text-gray-600">Monitor your volunteer hours and see the difference you make</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Featured Opportunities
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featured && featured.length > 0 ? (
              featured.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  id={opp.id}
                  title={opp.title}
                  category={opp.category}
                  location={opp.location}
                  remote={opp.remote}
                  organizationName={(opp.organizations as { name: string } | null)?.name}
                />
              ))
            ) : (
              fallbackFeatured.map((opportunity) => (
                <div key={opportunity.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="text-sm text-indigo-600 font-medium mb-2">{opportunity.category}</div>
                  <h3 className="text-xl font-semibold mb-2">{opportunity.title}</h3>
                  <p className="text-gray-600 mb-4">{opportunity.organizationName}</p>
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <span>{opportunity.remote ? "Remote" : opportunity.location}</span>
                  </div>
                  <Link href="/opportunities" className="text-indigo-600 font-medium hover:text-indigo-800">
                    Browse opportunities →
                  </Link>
                </div>
              ))
            )}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/opportunities"
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              View All Opportunities
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join volunteers already making a difference in their communities
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
          >
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  );
}
