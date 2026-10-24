-- Audit rows must be attributable to a real user.
--
-- The original INSERT policy accepted `user_id IS NULL OR user_id = auth.uid()`, so any signed-in
-- account could forge an anonymous entry with an arbitrary action and resource. Client code always
-- writes its own user id; the SECURITY DEFINER trigger (audit_verification_change) and
-- delete_my_account run as the table owner and are unaffected by RLS.
DROP POLICY IF EXISTS "Users write own audit entries" ON public.security_audit_log;
CREATE POLICY "Users write own audit entries" ON public.security_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
