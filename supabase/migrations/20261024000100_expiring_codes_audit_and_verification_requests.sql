-- Expiring verification codes, DB-backed audit trail, and verified-organization requests.

ALTER TABLE public.volunteer_hours
  ADD COLUMN IF NOT EXISTS verification_expires_at timestamptz;
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS verification_expires_at timestamptz;

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
           p.full_name AS name, o.title AS event, o.category,
           org.name AS organization, org.verified AS organizer_verified,
           a.completed_at::date AS date, NULL::numeric AS hours,
           a.supervisor_name, a.supervisor_title, a.supervisor_notes,
           a.cover_letter AS description, a.verified_at,
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

-- Backup audit layer: even if the client forgets logSecurityEvent, the database records approvals.
CREATE OR REPLACE FUNCTION public.audit_verification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_TABLE_NAME = 'volunteer_hours' AND NEW.verified AND NOT OLD.verified THEN
    INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
    VALUES (auth.uid(), 'hours.verify', 'volunteer_hours', NEW.id,
      jsonb_build_object('opportunity_id', NEW.opportunity_id,
        'verification_code', NEW.verification_code,
        'verified_by', NEW.verified_by));
  ELSIF TG_TABLE_NAME = 'applications' AND NEW.status = 'completed'
        AND OLD.status IS DISTINCT FROM 'completed' THEN
    INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
    VALUES (auth.uid(), 'task.complete', 'applications', NEW.id,
      jsonb_build_object('opportunity_id', NEW.opportunity_id,
        'verification_code', NEW.verification_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_hours_verification ON public.volunteer_hours;
CREATE TRIGGER audit_hours_verification
  AFTER UPDATE ON public.volunteer_hours
  FOR EACH ROW EXECUTE FUNCTION public.audit_verification_change();

DROP TRIGGER IF EXISTS audit_task_completion ON public.applications;
CREATE TRIGGER audit_task_completion
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.audit_verification_change();

-- Verified-organization request queue.
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "managers request verification" ON public.verification_requests;
CREATE POLICY "managers request verification" ON public.verification_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_manager(organization_id) AND requested_by = auth.uid());

DROP POLICY IF EXISTS "managers read own verification requests" ON public.verification_requests;
CREATE POLICY "managers read own verification requests" ON public.verification_requests
  FOR SELECT TO authenticated
  USING (public.is_org_manager(organization_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "admins review verification requests" ON public.verification_requests;
CREATE POLICY "admins review verification requests" ON public.verification_requests
  FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

GRANT SELECT, INSERT ON public.verification_requests TO authenticated;
GRANT UPDATE ON public.verification_requests TO authenticated;

REVOKE ALL ON FUNCTION public.audit_verification_change() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.verify_code(text) TO anon, authenticated;
