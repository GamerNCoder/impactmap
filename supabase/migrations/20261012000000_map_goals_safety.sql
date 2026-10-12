-- Map pins, student hour goals, guardian consent, and private profile fields.

-- Event map: coordinates are geocoded from the event address when it is posted.
ALTER TABLE opportunities
  ADD COLUMN latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
  ADD COLUMN longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180);

-- Hours goal shown on the passport and printable report (e.g. school or NHS requirement).
ALTER TABLE profiles
  ADD COLUMN hours_goal INTEGER CHECK (hours_goal BETWEEN 1 AND 1000),
  ADD COLUMN guardian_name TEXT,
  ADD COLUMN guardian_email TEXT,
  ADD COLUMN guardian_consent_at TIMESTAMPTZ;

-- Privacy for minors: other signed-in users (including adult organizers) see only public
-- profile fields. Contact details, birthday and guardian info are readable by the owner
-- through my_profile().
REVOKE SELECT ON profiles FROM authenticated;
GRANT SELECT (id, full_name, avatar_url, bio, skills, location, id_verification_status,
  created_at, updated_at, preferred_categories, hours_goal, terms_accepted_at, terms_version,
  is_platform_admin) ON profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.my_profile()
RETURNS SETOF profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.my_profile() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated;

-- The public hours page reads the goal alongside the name; it is not sensitive.
GRANT SELECT (hours_goal) ON profiles TO anon;
