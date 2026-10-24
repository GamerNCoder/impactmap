-- Guard each audit branch: NEW.status only exists on applications, not volunteer_hours.
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
