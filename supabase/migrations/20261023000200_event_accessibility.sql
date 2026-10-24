-- Organizer-declared access attributes. These are claims, not ImpactMap verification.
ALTER TABLE public.opportunities
  ADD COLUMN wheelchair_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN accessible_restroom BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN sensory_friendly BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN substance_free BOOLEAN NOT NULL DEFAULT FALSE;
