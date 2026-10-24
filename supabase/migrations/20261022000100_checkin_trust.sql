-- Check-in trust layer: record how far the volunteer's device was from the event and whether
-- the scan happened near the event date. The coordinates are used only to compute the distance
-- and are never stored; the organizer sees an approximate distance, not a location history.

ALTER TABLE public.event_checkins
  ADD COLUMN distance_m INTEGER,
  ADD COLUMN outside_window BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.haversine_m(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

DROP FUNCTION IF EXISTS public.check_in_event(uuid);

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

  SELECT id, latitude, longitude, start_date INTO v_event
  FROM opportunities WHERE id = p_opportunity_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  -- A null distance means "location not shared", which is allowed.
  v_distance := CASE
    WHEN v_event.latitude IS NOT NULL AND v_event.longitude IS NOT NULL
      AND p_lat IS NOT NULL AND p_lon IS NOT NULL
      AND p_lat BETWEEN -90 AND 90 AND p_lon BETWEEN -180 AND 180
    THEN round(public.haversine_m(v_event.latitude, v_event.longitude, p_lat, p_lon))::integer
    ELSE NULL
  END;

  -- Soft window: a scan more than a week before or after the event date is flagged, not blocked.
  v_outside := v_event.start_date IS NOT NULL
    AND (CURRENT_DATE < v_event.start_date - 7 OR CURRENT_DATE > v_event.start_date + 7);

  SELECT EXISTS (
    SELECT 1 FROM event_checkins
    WHERE opportunity_id = p_opportunity_id AND user_id = uid
  ) INTO v_already;

  IF v_already THEN
    RETURN jsonb_build_object(
      'ok', true, 'already', true,
      'distance_m', v_distance, 'outside_window', v_outside
    );
  END IF;

  INSERT INTO event_checkins (opportunity_id, user_id, source, distance_m, outside_window)
  VALUES (p_opportunity_id, uid, 'qr', v_distance, v_outside);

  RETURN jsonb_build_object(
    'ok', true, 'already', false,
    'distance_m', v_distance, 'outside_window', v_outside
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_in_event(uuid, double precision, double precision) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.check_in_event(uuid, double precision, double precision) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_checkin_location(
  p_opportunity_id uuid,
  p_lat double precision,
  p_lon double precision
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v_event record;
  v_distance integer;
  v_outside boolean;
  v_updated integer;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth');
  END IF;
  IF p_lat IS NULL OR p_lon IS NULL
    OR p_lat NOT BETWEEN -90 AND 90 OR p_lon NOT BETWEEN -180 AND 180 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'bad_location');
  END IF;

  SELECT latitude, longitude, start_date INTO v_event
  FROM opportunities WHERE id = p_opportunity_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  v_distance := CASE
    WHEN v_event.latitude IS NOT NULL AND v_event.longitude IS NOT NULL
    THEN round(public.haversine_m(v_event.latitude, v_event.longitude, p_lat, p_lon))::integer
    ELSE NULL
  END;

  v_outside := v_event.start_date IS NOT NULL
    AND (CURRENT_DATE < v_event.start_date - 7 OR CURRENT_DATE > v_event.start_date + 7);

  UPDATE event_checkins
  SET distance_m = v_distance, outside_window = v_outside
  WHERE opportunity_id = p_opportunity_id AND user_id = uid;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_checkin');
  END IF;

  RETURN jsonb_build_object('ok', true, 'distance_m', v_distance, 'outside_window', v_outside);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_checkin_location(uuid, double precision, double precision) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_checkin_location(uuid, double precision, double precision) TO authenticated;
