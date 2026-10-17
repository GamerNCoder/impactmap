-- Account deletion: the privacy policy promises that a user can ask for their account and
-- its data to be deleted, but until now nothing in the app could do it. A user only owns
-- their row in auth.users, and the client has no access to the auth schema, so the deletion
-- happens in a SECURITY DEFINER RPC that removes the auth row and lets the existing
-- ON DELETE CASCADE rules clear everything the user owns.
--
-- Cascade rules that matter (see 20261011000000_schema.sql and 20261015000000_event_checkins.sql):
--   ON DELETE CASCADE  profiles, organization_members, applications, volunteer_hours,
--                      volunteer_reviews, coordinator_requests, id_verification_submissions,
--                      transfer_requests, community_groups, group_members, shared_posts,
--                      event_checkins
--   ON DELETE SET NULL organizations.created_by, security_audit_log.user_id, app_events.user_id
--   no delete rule     applications.verified_by, volunteer_hours.verified_by,
--                      coordinator_requests.reviewed_by, id_verification_submissions.reviewed_by,
--                      org_api_keys.created_by
--
-- Postgres defaults to NO ACTION, so that last group blocks the delete. Those rows belong to
-- other people (a coordinator who approved someone else's hours, an admin who reviewed an ID
-- submission), so they are cleared rather than deleted, before the auth row goes.

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  -- No session, no deletion. The client falls back to {ok:false,error:'auth'}.
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth');
  END IF;

  -- Other people's rows that point at this account: cleared first or the DELETE would fail
  -- with a foreign key violation.
  UPDATE public.volunteer_hours SET verified_by = NULL WHERE verified_by = uid;
  UPDATE public.coordinator_requests SET reviewed_by = NULL WHERE reviewed_by = uid;
  UPDATE public.id_verification_submissions SET reviewed_by = NULL WHERE reviewed_by = uid;
  UPDATE public.org_api_keys SET created_by = NULL WHERE created_by = uid;

  -- applications.verified_by has the same foreign key problem, but applications additionally
  -- carries the guard_application_update trigger, which rejects any change to the verification
  -- columns unless the caller manages the event. A coordinator who verified completions and
  -- was later removed from the organization would otherwise never be able to delete their
  -- account, so that single trigger is suspended for the clean-up.
  -- The block is a subtransaction: if anything in it raises, the rollback re-enables the
  -- trigger, so it can never be left disabled.
  BEGIN
    ALTER TABLE public.applications DISABLE TRIGGER guard_application_update;
    UPDATE public.applications SET verified_by = NULL WHERE verified_by = uid;
    ALTER TABLE public.applications ENABLE TRIGGER guard_application_update;
  EXCEPTION WHEN OTHERS THEN
    -- e.g. this role is not the table owner. The fallback still clears the rows the caller can
    -- legitimately edit (events they manage); anything else surfaces as {ok:false,error:'failed'}.
    RAISE WARNING 'delete_my_account: guard_application_update not suspended: %', SQLERRM;
    UPDATE public.applications SET verified_by = NULL WHERE verified_by = uid;
  END;

  -- One anonymous trace that a deletion happened. security_audit_log.user_id is
  -- ON DELETE SET NULL, so the entry survives the delete without identifying the person.
  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (uid, 'account.delete', 'account', uid, jsonb_build_object('requested_at', now()));

  DELETE FROM auth.users WHERE id = uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
EXCEPTION WHEN OTHERS THEN
  -- The whole function body is this block, so every change above rolls back with the failure.
  RAISE WARNING 'delete_my_account failed for %: %', uid, SQLERRM;
  RETURN jsonb_build_object('ok', false, 'error', 'failed');
END;
$$;

COMMENT ON FUNCTION public.delete_my_account() IS
  'Deletes the calling user''s auth.users row (and, by cascade, their own data). Returns {ok,error}.';

-- Signed-in users only, and the function can only ever act on auth.uid().
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
