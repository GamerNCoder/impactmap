-- Public community impact: aggregate verified hours by cause, organization, month and event.
-- SECURITY INVOKER so the existing RLS policy ("verified hours are public") still applies.
-- The result contains no student id, name, email or any other identity field on purpose.

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
        'students', COUNT(DISTINCT user_id),
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
        ORDER BY SUM(hours) DESC
      ) t
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.impact_summary() FROM public;
GRANT EXECUTE ON FUNCTION public.impact_summary() TO anon, authenticated;
