-- Sample seed data for ImpactMap (run after schema.sql)
-- Safe to re-run: uses fixed UUIDs and ON CONFLICT

INSERT INTO organizations (id, name, description, website, email, location, verified) VALUES
  ('11111111-1111-1111-1111-111111111101', 'City Food Bank', 'Fighting hunger in our community by distributing food to families in need.', 'https://example.com/foodbank', 'volunteer@cityfoodbank.org', 'Downtown', true),
  ('11111111-1111-1111-1111-111111111102', 'Big Brothers Big Sisters', 'Mentoring youth to build confidence and reach their full potential.', 'https://example.com/bbbs', 'mentor@bbbs.org', 'Multiple Locations', true),
  ('11111111-1111-1111-1111-111111111103', 'Green Earth Initiative', 'Environmental conservation through community cleanups and education.', 'https://example.com/greenearth', 'hello@greenearth.org', 'City Park', true),
  ('11111111-1111-1111-1111-111111111104', 'Community Health Clinic', 'Free health services and wellness programs for underserved populations.', 'https://example.com/healthclinic', 'volunteer@healthclinic.org', 'East Side', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO opportunities (
  id, organization_id, title, description, category, skills_required,
  location, remote, time_commitment, start_date, deadline,
  volunteers_needed, volunteers_count, status, requirements, benefits
) VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'Community Food Bank Volunteer',
    'Help sort, pack, and distribute food donations to families in our community. No experience needed — just a willingness to help and a friendly attitude.',
    'Food Security',
    ARRAY['Teamwork', 'Physical stamina'],
    '123 Main St, Downtown',
    false,
    '4 hours/week',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '60 days',
    20, 5, 'open',
    'Must be 16+. Comfortable standing for extended periods.',
    'Community service hours, team meals, impact certificate.'
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111102',
    'Youth Mentorship Program',
    'Be a positive role model for a young person. Meet weekly for activities, homework help, and meaningful conversations.',
    'Education',
    ARRAY['Communication', 'Patience', 'Reliability'],
    'Multiple Locations',
    true,
    '2 hours/week',
    CURRENT_DATE + INTERVAL '14 days',
    CURRENT_DATE + INTERVAL '45 days',
    15, 3, 'open',
    'Background check required. 6-month minimum commitment.',
    'Training provided, networking events, reference letters.'
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111103',
    'Environmental Cleanup Day',
    'Join us for a park cleanup event. Help remove litter, plant native species, and restore natural habitats.',
    'Environment',
    ARRAY['Outdoor work'],
    'City Park, North Entrance',
    false,
    'One-time, 4 hours',
    CURRENT_DATE + INTERVAL '21 days',
    CURRENT_DATE + INTERVAL '20 days',
    50, 12, 'open',
    'Wear closed-toe shoes. Gloves and supplies provided.',
    'Free lunch, volunteer t-shirt, group photo.'
  ),
  (
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111104',
    'Health Clinic Front Desk Assistant',
    'Greet patients, manage appointment check-ins, and help maintain a welcoming clinic environment.',
    'Health',
    ARRAY['Customer service', 'Organization'],
    '456 Health Ave, East Side',
    false,
    '6 hours/week',
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '30 days',
    8, 2, 'open',
    'Must be 18+. HIPAA training provided on-site.',
    'Healthcare exposure, flexible scheduling, training certificate.'
  ),
  (
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111101',
    'Virtual Fundraising Coordinator',
    'Help plan and run online fundraising campaigns from home. Great for marketing and social media enthusiasts.',
    'Community',
    ARRAY['Social media', 'Writing', 'Organization'],
    NULL,
    true,
    '3 hours/week',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    5, 1, 'open',
    'Reliable internet connection. Experience with social platforms preferred.',
    'Remote work experience, portfolio projects, nonprofit references.'
  )
ON CONFLICT (id) DO NOTHING;
