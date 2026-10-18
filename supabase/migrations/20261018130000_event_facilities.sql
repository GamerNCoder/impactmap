-- On-site facilities an organizer declares (restrooms, drinking water, accessible entrance, …).
--
-- The "near the event" card pulls cafes/transit from OpenStreetMap, but OSM has almost no
-- toilets or drinking water tagged near ordinary event sites (0 toilets and 0 drinking water
-- around Roosevelt Park), so those must come from the organizer rather than from OSM.
ALTER TABLE opportunities ADD COLUMN facilities TEXT[];
