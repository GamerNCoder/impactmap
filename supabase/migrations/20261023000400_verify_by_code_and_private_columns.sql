-- Public verification is by code only. These SECURITY DEFINER functions return the fields a
-- counselor already sees and bypass the table RLS for that single code; the broad public row
-- policies are removed so the tables cannot be enumerated.
CREATE OR REPLACE FUNCTION public.verify_code(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH h AS (
    SELECT 'hours'::text AS type, vh.verification_code AS code,
           p.full_name AS name, o.title AS event, o.category,
           org.name AS organization, org.verified AS organizer_verified,
           vh.date, vh.hours, vh.supervisor_name, vh.supervisor_title,
           vh.supervisor_notes, vh.description, vh.verified_at,
           NULL::text AS status
    FROM volunteer_hours vh
    JOIN opportunities o ON o.id = vh.opportunity_id
    LEFT JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN profiles p ON p.id = vh.user_id
    WHERE vh.verification_code = p_code AND vh.verified = true
  ), c AS (
    SELECT 'completion'::text AS type, a.verification_code AS code,
           p.full_name AS name, o.title AS event, o.category,
           org.name AS organization, org.verified AS organizer_verified,
           a.completed_at::date AS date, NULL::numeric AS hours,
           a.supervisor_name, a.supervisor_title, a.supervisor_notes,
           a.cover_letter AS description, a.verified_at, a.status
    FROM applications a
    JOIN opportunities o ON o.id = a.opportunity_id
    LEFT JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN profiles p ON p.id = a.user_id
    WHERE a.verification_code = p_code AND a.status = 'completed'
  )
  SELECT to_jsonb(x)
  FROM (SELECT * FROM h UNION ALL SELECT * FROM c) x
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.verify_codes(p_codes text[])
RETURNS SETOF jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.verify_code(code) FROM unnest(p_codes) AS code
  WHERE public.verify_code(code) IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_code(text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_codes(text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_codes(text[]) TO anon, authenticated;

-- No anonymous table enumeration. Owners/managers/students still see their rows through RLS.
DROP POLICY IF EXISTS "Verified hours are public" ON public.volunteer_hours;
DROP POLICY IF EXISTS "Verified completions are public" ON public.applications;

-- Organization billing/plan fields and admin-only profile fields stay private.
REVOKE SELECT ON public.organizations FROM anon, authenticated;
GRANT SELECT (id, name, description, website, location, email, phone, verified, created_at) ON public.organizations TO anon, authenticated;
REVOKE SELECT (is_platform_admin, terms_accepted_at, terms_version) ON public.profiles FROM authenticated;
