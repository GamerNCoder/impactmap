-- QR attendance: scanning an event's check-in QR records that the student turned up.
--
-- Until now "check in by QR code" only deep-linked to the event page, so an organizer
-- had no way to see who actually attended. Attendance is its own record (not derived
-- from applications) so that walk-ins count too.

CREATE TABLE event_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'qr',
  UNIQUE (opportunity_id, user_id)
);

CREATE INDEX event_checkins_opportunity_idx ON event_checkins (opportunity_id);

ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

-- Students record and undo only their own check-in; organizers read their own events'.
CREATE POLICY "Volunteers record their own check-in" ON event_checkins
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Volunteers read their own check-in" ON event_checkins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_opportunity_manager(opportunity_id));

CREATE POLICY "Volunteers undo their own check-in" ON event_checkins
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Idempotent check-in for the QR flow: scanning twice is not an error.
CREATE OR REPLACE FUNCTION public.check_in_event(p_opportunity_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  already boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = p_opportunity_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM event_checkins
    WHERE opportunity_id = p_opportunity_id AND user_id = uid
  ) INTO already;

  IF already THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  INSERT INTO event_checkins (opportunity_id, user_id, source)
  VALUES (p_opportunity_id, uid, 'qr');

  RETURN jsonb_build_object('ok', true, 'already', false);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_in_event(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.check_in_event(uuid) TO authenticated;
