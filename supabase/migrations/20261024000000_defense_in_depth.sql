-- Defense in depth for the ImpactMap public data surface.
-- Primary: RLS. Backup: least-privilege grants. Detection: scripts/audit-defenses.mjs.
-- If this migration is dropped, the audit must fail and the reapply script must restore it.

-- 1) Remove the default Supabase broad grants. RLS alone is not enough: TRUNCATE is not row-filtered.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, public;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2) Anonymous read surface: only public discovery fields; no memberships, audit log, or hours.
GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT (id, full_name, bio, created_at) ON public.profiles TO anon;
GRANT SELECT (id, name, description, website, location, verified, created_at, email, phone)
  ON public.organizations TO anon;
GRANT INSERT ON public.app_events TO anon;
GRANT INSERT ON public.pilot_requests TO anon;

-- 3) Signed-in app surface: CRUD the app needs, never TRUNCATE/REFERENCES/TRIGGER.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.app_events,
  public.applications,
  public.coordinator_requests,
  public.event_checkins,
  public.opportunities,
  public.organization_members,
  public.organizations,
  public.pilot_requests,
  public.profiles,
  public.security_audit_log,
  public.volunteer_hours
TO authenticated;

-- 4) RPC surface: verification is public; mutations require a signed-in user.
GRANT EXECUTE ON FUNCTION public.verify_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_codes(text[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_manager(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_opportunity_manager(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_claim_new_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_opportunity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_opportunity(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_event(uuid, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_checkin_location(uuid, double precision, double precision) TO authenticated;

-- 5) Pin mutable search paths flagged by the Supabase security advisor.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.haversine_m(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;
