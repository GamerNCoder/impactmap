-- Second-account self-dealing: if the volunteer is a member of the event's organization,
-- an unverified organization cannot issue them a verified-hours code, even when a different
-- coordinator account performs the approval. Independent volunteers are unaffected.
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

    IF auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM opportunities o
      JOIN organization_members om ON om.organization_id = o.organization_id
      JOIN organizations org ON org.id = o.organization_id
      WHERE o.id = NEW.opportunity_id
        AND om.user_id = NEW.user_id
        AND org.verified = false
    ) THEN
      RAISE EXCEPTION 'An unverified organization cannot issue verified hours to its own member.'
        USING ERRCODE = '42501';
    END IF;

    NEW.verified_by := COALESCE(auth.uid(), NEW.verified_by);
    NEW.verified_at := COALESCE(NEW.verified_at, now());
  END IF;
  RETURN NEW;
END;
$$;
