-- Reset the shared demo without requiring the service-role key at runtime.
CREATE OR REPLACE FUNCTION public.reset_demo(p_student_email text)
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
  SELECT id INTO v_student FROM public.profiles WHERE email = p_student_email LIMIT 1;
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
    user_id = excluded.user_id,
    opportunity_id = excluded.opportunity_id,
    date = excluded.date,
    hours = excluded.hours,
    description = excluded.description,
    verified = false,
    verified_by = NULL,
    verified_at = NULL,
    verification_code = NULL,
    verification_expires_at = NULL,
    supervisor_name = NULL,
    supervisor_title = NULL,
    supervisor_email = NULL,
    supervisor_notes = NULL;

  UPDATE public.profiles SET full_name = 'Demo Student' WHERE id = v_student;

  INSERT INTO public.security_audit_log (user_id, action, resource_type, resource_id, metadata)
  VALUES (NULL, 'demo.reset', 'volunteer_hours', v_id, jsonb_build_object('source', 'demo_button'));

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reset_demo(text) FROM public;
GRANT EXECUTE ON FUNCTION public.reset_demo(text) TO anon, authenticated;
