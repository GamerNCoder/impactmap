-- Check-in requires a real, accepted place on the event. Scanning any event's public QR
-- from anywhere is no longer enough to create an attendance record.
CREATE OR REPLACE FUNCTION public.check_in_event(
  p_opportunity_id uuid,
  p_lat double precision DEFAULT NULL,
  p_lon double precision DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_event record;
  v_already boolean;
  v_distance integer;
  v_outside boolean;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM applications
    WHERE opportunity_id = p_opportunity_id
      AND user_id = uid
      AND status IN ('accepted', 'completed')
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_joined');
  END IF;

  SELECT id, latitude, longitude, start_date INTO v_event
  FROM opportunities WHERE id = p_opportunity_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  v_distance := CASE
    WHEN v_event.latitude IS NOT NULL AND v_event.longitude IS NOT NULL
      AND p_lat IS NOT NULL AND p_lon IS NOT NULL
      AND p_lat BETWEEN -90 AND 90 AND p_lon BETWEEN -180 AND 180
    THEN round(public.haversine_m(v_event.latitude, v_event.longitude, p_lat, p_lon))::integer
    ELSE NULL
  END;

  v_outside := v_event.start_date IS NOT NULL
    AND (CURRENT_DATE < v_event.start_date - 7 OR CURRENT_DATE > v_event.start_date + 7);

  SELECT EXISTS (
    SELECT 1 FROM event_checkins
    WHERE opportunity_id = p_opportunity_id AND user_id = uid
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object('ok', true, 'already', true,
      'distance_m', v_distance, 'outside_window', v_outside);
  END IF;

  INSERT INTO event_checkins (opportunity_id, user_id, source, distance_m, outside_window)
  VALUES (p_opportunity_id, uid, 'qr', v_distance, v_outside);

  RETURN jsonb_build_object('ok', true, 'already', false,
    'distance_m', v_distance, 'outside_window', v_outside);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_in_event(uuid, double precision, double precision) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.check_in_event(uuid, double precision, double precision) TO authenticated;
