-- Close the live privacy defect: `anon` held column grants on profiles for bio, skills and
-- location, and the SELECT policy is USING (true), so any anonymous visitor could enumerate
-- every student's town, bio and skills via the REST API.
--
-- profiles.bio / skills / location / avatar_url / id_verification_status are not read by the
-- app at runtime — no route, component or RPC uses them. The public pages need only id,
-- full_name and hours_goal; the owner's private fields come through the SECURITY DEFINER
-- my_profile() RPC, which is unaffected by column grants. Drop the dead columns from both
-- public roles so a minor's location/bio/skills are never exposed to anon or to random
-- signed-in adults (the profile page promises "Organizers only see your name").
REVOKE SELECT ON profiles FROM anon;
GRANT SELECT (id, full_name, hours_goal) ON profiles TO anon;

REVOKE SELECT ON profiles FROM authenticated;
GRANT SELECT (id, full_name, avatar_url, id_verification_status, created_at, updated_at,
  preferred_categories, hours_goal, terms_accepted_at, terms_version, is_platform_admin)
  ON profiles TO authenticated;
