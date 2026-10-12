-- Sample seed data for ImpactMap (run after schema.sql)
-- Safe to re-run: uses fixed UUIDs and ON CONFLICT
-- Demo listings for Edison, NJ (NJ-6). Organizers are fictional; locations are real public places.

INSERT INTO organizations (id, name, description, website, email, location, verified) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Edison Student Food Drive', 'Students collecting and sorting food for Middlesex County families in need.', 'https://example.org/edison-food-drive', 'volunteer@example.org', 'Edison, NJ', true),
  ('11111111-1111-1111-1111-111111111102', 'Edison Library Homework Helpers', 'High schoolers tutoring younger students after school.', 'https://example.org/homework-helpers', 'tutors@example.org', 'Edison Public Library', true),
  ('11111111-1111-1111-1111-111111111103', 'Green Edison Youth', 'Teen-led park and trail cleanups across Edison.', 'https://example.org/green-edison', 'hello@example.org', 'Roosevelt Park', true),
  ('11111111-1111-1111-1111-111111111104', 'Edison Senior Tech Buddies', 'Teens helping seniors use phones, email and video calls.', 'https://example.org/tech-buddies', 'buddies@example.org', 'Edison, NJ', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  website = EXCLUDED.website, email = EXCLUDED.email, location = EXCLUDED.location;

INSERT INTO opportunities (
  id, organization_id, title, description, category, skills_required,
  location, remote, time_commitment, start_date, deadline,
  volunteers_needed, volunteers_count, status, requirements, benefits, latitude, longitude
) VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'Saturday Food Sort',
    'Sort and pack donated food into family boxes for local pantries. No experience needed.',
    'Food Security',
    ARRAY['Teamwork'],
    'Papaianni Park pavilion, Edison, NJ',
    false,
    '3 hours, Saturdays',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '60 days',
    20, 5, 'open',
    'Ages 13+. Closed-toe shoes.',
    'Verified service hours, certificate.',
    40.5285, -74.3915
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'After-School Homework Help',
    'Help elementary and middle schoolers with reading and math homework.',
    'Education',
    ARRAY['Patience', 'Communication'],
    'Edison Public Library (Main Branch), Plainfield Ave, Edison, NJ',
    false,
    '2 hours/week',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '45 days',
    15, 3, 'open',
    'Ages 14+. Weekly commitment for at least one month.',
    'Verified service hours, recommendation letter after 20 hours.',
    40.517465, -74.408179
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    'Roosevelt Park Fall Cleanup',
    'Pick up litter around the lake and trails and clear leaves from paths.',
    'Environment',
    ARRAY['Outdoor work'],
    'Roosevelt Park, Edison, NJ',
    false,
    'One-time, 3 hours',
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '9 days',
    40, 12, 'open',
    'Ages 13+. Gloves and bags provided.',
    'Verified service hours, group photo.',
    40.547088, -74.341672
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111103',
    'Dismal Swamp Trail Restoration',
    'Remove invasive plants and help maintain boardwalk trails in the conservation area.',
    'Environment',
    ARRAY['Outdoor work', 'Physical stamina'],
    'Dismal Swamp Conservation Area, New Durham Rd, Edison, NJ',
    false,
    'One-time, 4 hours',
    CURRENT_DATE + INTERVAL '21 days',
    CURRENT_DATE + INTERVAL '20 days',
    25, 6, 'open',
    'Ages 14+. Long pants and boots recommended.',
    'Verified service hours, intro to local ecology.',
    40.558148, -74.401524
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111104',
    'Virtual Tech Help for Seniors',
    'Walk seniors through video calls, email and phone settings over a scheduled video chat.',
    'Community',
    ARRAY['Patience', 'Tech basics'],
    NULL,
    true,
    '1 hour/week',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    10, 2, 'open',
    'Ages 13+. Reliable internet connection.',
    'Verified service hours, remote volunteering experience.',
    NULL, NULL
  )
ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id, title = EXCLUDED.title,
  description = EXCLUDED.description, category = EXCLUDED.category, skills_required = EXCLUDED.skills_required,
  location = EXCLUDED.location, remote = EXCLUDED.remote, time_commitment = EXCLUDED.time_commitment,
  requirements = EXCLUDED.requirements, benefits = EXCLUDED.benefits,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;
