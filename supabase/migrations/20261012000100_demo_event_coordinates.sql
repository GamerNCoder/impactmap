-- Map pins for the Edison demo events (the seed only runs on fresh databases).
UPDATE opportunities AS o SET latitude = v.lat, longitude = v.lng
FROM (VALUES
  ('22222222-2222-2222-2222-222222222201'::uuid, 40.5285, -74.3915),
  ('22222222-2222-2222-2222-222222222202'::uuid, 40.517465, -74.408179),
  ('22222222-2222-2222-2222-222222222203'::uuid, 40.547088, -74.341672),
  ('22222222-2222-2222-2222-222222222204'::uuid, 40.558148, -74.401524)
) AS v(id, lat, lng)
WHERE o.id = v.id AND o.latitude IS NULL;
