-- A misclicked approval needs an audited soft revoke, not a hard delete: the code stays on the
-- record, the record stops counting everywhere, and a manager can undo it. RLS already limits
-- UPDATE to the event's managers; the guard trigger validates the transition and the audit trigger
-- records it even when a client writes the table directly.

ALTER TABLE public.volunteer_hours
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.volunteer_hours
  DROP CONSTRAINT IF EXISTS volunteer_hours_revocation_requires_approval;
ALTER TABLE public.volunteer_hours
  ADD CONSTRAINT volunteer_hours_revocation_requires_approval
  CHECK (revoked_at IS NULL OR verified = true);

CREATE INDEX IF NOT EXISTS idx_volunteer_hours_active_verified
  ON public.volunteer_hours (opportunity_id)
  WHERE verified = true AND revoked_at IS NULL;

CREATE OR REPLACE FUNCTION public.guard_hours_revocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.revoked_at IS NOT DISTINCT FROM OLD.revoked_at
     AND NEW.revoked_by IS NOT DISTINCT FROM OLD.revoked_by THEN
    RETURN NEW;
  END IF;

  IF NEW.revoked_at IS NOT NULL THEN
    IF NOT COALESCE(NEW.verified, false) OR NEW.verification_code IS NULL THEN
      RAISE EXCEPTION 'Only approved hours with a verification code can be revoked.'
        USING ERRCODE = '23514';
    END IF;
    IF OLD.revoked_at IS NOT NULL THEN
      -- An existing revocation is immutable; only a restore can change it.
      NEW.revoked_at := OLD.revoked_at;
      NEW.revoked_by := OLD.revoked_by;
    ELSE
      -- Server time, and the caller is the revoker; a manager cannot pin it on someone else.
      NEW.revoked_at := now();
      NEW.revoked_by := COALESCE(auth.uid(), NEW.revoked_by);
    END IF;
  ELSE
    NEW.revoked_by := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_hours_revocation ON public.volunteer_hours;
CREATE TRIGGER guard_hours_revocation
  BEFORE UPDATE ON public.volunteer_hours
  FOR EACH ROW EXECUTE FUNCTION public.guard_hours_revocation();

-- Backup audit layer: direct table writes and the RPCs below both land here.
CREATE OR REPLACE FUNCTION public.audit_verification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'volunteer_hours' THEN
    IF NEW.verified AND NOT OLD.verified THEN
      INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
      VALUES (auth.uid(), 'hours.verify', 'volunteer_hours', NEW.id,
        jsonb_build_object('opportunity_id', NEW.opportunity_id,
          'verification_code', NEW.verification_code,
          'verified_by', NEW.verified_by));
    ELSIF NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
      INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
      VALUES (auth.uid(), 'hours.revoke', 'volunteer_hours', NEW.id,
        jsonb_build_object('opportunity_id', NEW.opportunity_id,
          'verification_code', NEW.verification_code,
          'hours', NEW.hours,
          'revoked_by', NEW.revoked_by));
    ELSIF NEW.revoked_at IS NULL AND OLD.revoked_at IS NOT NULL THEN
      INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
      VALUES (auth.uid(), 'hours.restore', 'volunteer_hours', NEW.id,
        jsonb_build_object('opportunity_id', NEW.opportunity_id,
          'verification_code', NEW.verification_code,
          'hours', NEW.hours));
    END IF;
  ELSIF TG_TABLE_NAME = 'applications' THEN
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
      INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
      VALUES (auth.uid(), 'task.complete', 'applications', NEW.id,
        jsonb_build_object('opportunity_id', NEW.opportunity_id,
          'verification_code', NEW.verification_code));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_verification_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_hours_revocation() FROM anon, authenticated;

-- Validated entry points for the UI. SECURITY DEFINER so the check is explicit in the function,
-- not only in the caller's RLS context; the trigger still runs and writes the audit row.
CREATE OR REPLACE FUNCTION public.revoke_hours(p_hours_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.volunteer_hours%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_row FROM public.volunteer_hours WHERE id = p_hours_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF NOT public.is_opportunity_manager(v_row.opportunity_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_manager');
  END IF;
  IF NOT COALESCE(v_row.verified, false) OR v_row.verification_code IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_approved');
  END IF;
  IF v_row.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  UPDATE public.volunteer_hours
  SET revoked_at = now(), revoked_by = auth.uid()
  WHERE id = p_hours_id;

  RETURN jsonb_build_object('ok', true, 'already', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_hours(p_hours_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_row public.volunteer_hours%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_row FROM public.volunteer_hours WHERE id = p_hours_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF NOT public.is_opportunity_manager(v_row.opportunity_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_manager');
  END IF;
  IF v_row.revoked_at IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  UPDATE public.volunteer_hours
  SET revoked_at = NULL, revoked_by = NULL
  WHERE id = p_hours_id;

  RETURN jsonb_build_object('ok', true, 'already', false);
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_hours(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.restore_hours(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.revoke_hours(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_hours(uuid) TO authenticated;

-- A revoked code keeps answering, but as a revoked record: a counselor learns the organizer took
-- it back instead of seeing a silent 404. Expired non-revoked codes still disappear.
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
           vh.verification_expires_at,
           CASE WHEN vh.revoked_at IS NOT NULL THEN 'revoked' ELSE NULL END::text AS status,
           vh.revoked_at
    FROM volunteer_hours vh
    JOIN opportunities o ON o.id = vh.opportunity_id
    LEFT JOIN organizations org ON org.id = o.organization_id
    LEFT JOIN profiles p ON p.id = vh.user_id
    WHERE vh.verification_code = p_code
      AND vh.verified = true
      AND (vh.revoked_at IS NOT NULL
           OR vh.verification_expires_at IS NULL
           OR vh.verification_expires_at > now())
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
           a.verification_expires_at, a.status::text, NULL::timestamptz AS revoked_at
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

-- Public impact counts only approvals that still stand.
CREATE OR REPLACE FUNCTION public.impact_summary()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH verified AS (
    SELECT vh.hours, vh.user_id, vh.date,
           o.id AS opportunity_id, o.title, o.category, o.latitude, o.longitude,
           org.id AS organization_id, org.name AS organization_name
    FROM public.volunteer_hours vh
    JOIN public.opportunities o ON o.id = vh.opportunity_id
    LEFT JOIN public.organizations org ON org.id = o.organization_id
    WHERE vh.verified = true
      AND vh.verification_code IS NOT NULL
      AND vh.revoked_at IS NULL
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

-- The demo must be repeatable: a visitor who revokes a demo approval is reset with the pending log.
CREATE OR REPLACE FUNCTION public.reset_demo()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student uuid;
  v_org constant uuid := '33333333-3333-3333-3333-333333333301';
  v_opp constant uuid := '44444444-4444-4444-4444-444444444402';
  v_id constant uuid := '66666666-6666-6666-6666-666666666602';
BEGIN
  SELECT user_id INTO v_student FROM public.volunteer_hours WHERE id = v_id;
  IF v_student IS NULL THEN
    SELECT user_id INTO v_student FROM public.applications
    WHERE opportunity_id = v_opp ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF v_student IS NULL THEN
    SELECT id INTO v_student FROM public.profiles WHERE full_name = 'Demo Student' LIMIT 1;
  END IF;
  IF v_student IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'demo student missing');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.opportunities WHERE id = v_opp AND organization_id = v_org) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'demo event missing');
  END IF;

  INSERT INTO public.volunteer_hours (
    id, user_id, opportunity_id, date, hours, description,
    verified, verified_by, verified_at, verification_code, verification_expires_at,
    supervisor_name, supervisor_title, supervisor_email, supervisor_notes
  ) VALUES (
    v_id, v_student, v_opp, current_date - 1, 2,
    'Helped two students with fractions and reading.',
    false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = excluded.user_id, opportunity_id = excluded.opportunity_id,
    date = excluded.date, hours = excluded.hours, description = excluded.description,
    verified = false, verified_by = NULL, verified_at = NULL,
    verification_code = NULL, verification_expires_at = NULL,
    supervisor_name = NULL, supervisor_title = NULL,
    supervisor_email = NULL, supervisor_notes = NULL;

  UPDATE public.volunteer_hours
  SET revoked_at = NULL, revoked_by = NULL
  WHERE id IN (
    '66666666-6666-6666-6666-666666666601',
    '66666666-6666-6666-6666-666666666603',
    '66666666-6666-6666-6666-666666666604'
  ) AND revoked_at IS NOT NULL;

  UPDATE public.profiles SET full_name = 'Demo Student' WHERE id = v_student;
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (NULL, 'demo.reset', 'volunteer_hours', v_id, jsonb_build_object('source', 'demo_button'));
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_demo() FROM public;
GRANT EXECUTE ON FUNCTION public.reset_demo() TO anon, authenticated;
