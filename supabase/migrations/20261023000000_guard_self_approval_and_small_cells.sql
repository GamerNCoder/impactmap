-- Close the self-dealing hole: the student whose hours are being approved cannot
-- also be the approver, even if they own the organization and post the event.
-- A host approving someone else's hours remains allowed.
CREATE OR REPLACE FUNCTION public.guard_self_approved_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.verified = true AND OLD.verified = false THEN
    IF auth.uid() IS NOT NULL AND NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'You cannot approve your own volunteer hours.'
        USING ERRCODE = '42501';
    END IF;
    NEW.verified_by := COALESCE(auth.uid(), NEW.verified_by);
    NEW.verified_at := COALESCE(NEW.verified_at, now());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_self_approved_hours ON public.volunteer_hours;
CREATE TRIGGER guard_self_approved_hours
  BEFORE UPDATE ON public.volunteer_hours
  FOR EACH ROW EXECUTE FUNCTION public.guard_self_approved_hours();

-- Public impact is a k-anonymous aggregate: no row for a group with fewer than
-- 3 distinct volunteers, and no total student count below 5. The totals for
-- hours and records remain useful public context without naming anyone.
CREATE OR REPLACE FUNCTION public.impact_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH verified AS (
    SELECT vh.hours, vh.user_id, vh.date,
           o.id AS opportunity_id, o.title, o.category, o.latitude, o.longitude,
           org.id AS organization_id, org.name AS organization_name
    FROM public.volunteer_hours vh
    JOIN public.opportunities o ON o.id = vh.opportunity_id
    LEFT JOIN public.organizations org ON org.id = o.organization_id
    WHERE vh.verified = true AND vh.verification_code IS NOT NULL
  )
  SELECT jsonb_build_object(
    'totals', (
      SELECT jsonb_build_object(
        'hours', COALESCE(SUM(hours), 0),
        'records', COUNT(*),
        'students', CASE WHEN COUNT(DISTINCT user_id) >= 5
                         THEN COUNT(DISTINCT user_id) ELSE NULL END,
        'events', COUNT(DISTINCT opportunity_id),
        'organizations', COUNT(DISTINCT organization_id)
      )
      FROM verified
    ),
    'by_category', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT category, SUM(hours)::numeric AS hours, COUNT(*)::int AS records
        FROM verified
        GROUP BY category
        HAVING COUNT(DISTINCT user_id) >= 3
        ORDER BY SUM(hours) DESC
      ) t
    ),
    'by_organization', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT COALESCE(organization_name, 'Independent') AS organization,
               SUM(hours)::numeric AS hours, COUNT(*)::int AS records
        FROM verified
        GROUP BY organization_name
        HAVING COUNT(DISTINCT user_id) >= 3
        ORDER BY SUM(hours) DESC
      ) t
    ),
    'by_month', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month,
               SUM(hours)::numeric AS hours, COUNT(*)::int AS records
        FROM verified
        GROUP BY date_trunc('month', date)
        HAVING COUNT(DISTINCT user_id) >= 3
        ORDER BY date_trunc('month', date)
      ) t
    ),
    'map', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
      FROM (
        SELECT opportunity_id AS id, title, category, latitude, longitude,
               SUM(hours)::numeric AS hours
        FROM verified
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        GROUP BY opportunity_id, title, category, latitude, longitude
        HAVING COUNT(DISTINCT user_id) >= 3
        ORDER BY SUM(hours) DESC
      ) t
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.impact_summary() FROM public;
GRANT EXECUTE ON FUNCTION public.impact_summary() TO anon, authenticated;
