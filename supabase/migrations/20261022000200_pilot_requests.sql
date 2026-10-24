-- Pilot requests: a public form, insert-only. Nobody can read other people's submissions through
-- the Data API; the team reads them through the Supabase dashboard/service role.

CREATE TABLE public.pilot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pilot_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.pilot_requests FROM anon, authenticated;
GRANT INSERT ON public.pilot_requests TO anon, authenticated;

CREATE POLICY "Anyone can request a pilot" ON public.pilot_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
