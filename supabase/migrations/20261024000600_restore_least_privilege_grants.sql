-- Restore least privilege after 20261024000000_defense_in_depth.
--
-- That migration dropped the broad default grants, but its replacement surface was too wide and
-- incomplete:
--   * `GRANT SELECT ... ON profiles TO authenticated` was table-wide, so any signed-in adult
--     could read every profile's email, birthday, location, bio and availability.
--   * `GRANT SELECT (id, full_name, bio, created_at) ON profiles TO anon` re-exposed bio.
--   * `GRANT SELECT ... ON organizations TO authenticated` was table-wide, re-exposing billing
--     columns.
--   * the blanket function revoke removed impact_summary() EXECUTE without restoring it, so the
--     public impact page failed with "permission denied for function impact_summary".
--
-- REVOKE SELECT also clears column-level SELECT grants, so each role is rebuilt from the exact
-- column set the app reads. Writes stay table-level; RLS limits them to the owner's rows.

REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, hours_goal) ON public.profiles TO anon;
GRANT SELECT (id, full_name, avatar_url, id_verification_status, created_at, updated_at,
  preferred_categories, hours_goal) ON public.profiles TO authenticated;

REVOKE SELECT ON public.organizations FROM authenticated;
GRANT SELECT (id, name, description, website, location, email, phone, verified, created_at)
  ON public.organizations TO authenticated;

-- The public impact page has no volunteer_hours grant by design, so the aggregate runs as its
-- owner and returns only the k-anonymous output built by the function body.
ALTER FUNCTION public.impact_summary() SECURITY DEFINER;
ALTER FUNCTION public.impact_summary() SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.impact_summary() FROM public;
GRANT EXECUTE ON FUNCTION public.impact_summary() TO anon, authenticated;
