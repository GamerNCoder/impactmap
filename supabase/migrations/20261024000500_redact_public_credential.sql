-- Public credential: show a partial name and no free-text service/supervisor notes.
-- The organizer still has the full record; the code is a bearer credential.
CREATE OR REPLACE FUNCTION public.verify_code(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH h AS (
    SELECT 'hours'::text AS type, vh.verification_code AS code,
           CASE WHEN p.full_name IS NULL THEN NULL
                ELSE split_part(p.full_name, ' ', 1) ||
                     CASE WHEN split_part(p.full_name, ' ', 2) <> ''
                          THEN ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.'
                          ELSE '' END
           END AS name,
           o.title AS event, o.category,
           org.name AS organization, org.verified AS organizer_verified,
           vh.date, vh.hours, vh.supervisor_name, vh.supervisor_title,
           NULL::text AS supervisor_notes, NULL::text AS description, vh.verified_at,
           vh.verification_expires_at, NULL::text AS status
    FROM volunteer_hours vh
    JOIN opportunities o ON o.id = vh.opportunity_id
    LEFT JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN profiles p ON p.id = vh.user_id
    WHERE vh.verification_code = p_code
      AND vh.verified = true
      AND (vh.verification_expires_at IS NULL OR vh.verification_expires_at > now())
  ), c AS (
    SELECT 'completion'::text AS type, a.verification_code AS code,
           CASE WHEN p.full_name IS NULL THEN NULL
                ELSE split_part(p.full_name, ' ', 1) ||
                     CASE WHEN split_part(p.full_name, ' ', 2) <> ''
                          THEN ' ' || left(split_part(p.full_name, ' ', 2), 1) || '.'
                          ELSE '' END
           END AS name,
           o.title AS event, o.category,
           org.name AS organization, org.verified AS organizer_verified,
           a.completed_at::date AS date, NULL::numeric AS hours,
           a.supervisor_name, a.supervisor_title,
           NULL::text AS supervisor_notes, NULL::text AS description, a.verified_at,
           a.verification_expires_at, a.status
    FROM applications a
    JOIN opportunities o ON o.id = a.opportunity_id
    LEFT JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN profiles p ON p.id = a.user_id
    WHERE a.verification_code = p_code
      AND a.status = 'completed'
      AND (a.verification_expires_at IS NULL OR a.verification_expires_at > now())
  )
  SELECT to_jsonb(x)
  FROM (SELECT * FROM h UNION ALL SELECT * FROM c) x
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_code(text) TO anon, authenticated;
