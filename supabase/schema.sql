-- ImpactMap schema: student volunteer hours with coordinator-verified IMP- codes.
-- Rebuilt 2026-10-11 from src/types/database.ts and the app's queries.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────── Core tables ─────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  location TEXT,
  phone TEXT,
  date_of_birth DATE,
  preferred_categories TEXT[],
  volunteer_availability TEXT[],
  referral_source TEXT,
  marketing_consent BOOLEAN DEFAULT FALSE,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  id_verification_status TEXT DEFAULT 'none',
  id_certificate_code TEXT,
  is_platform_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  billing_email TEXT,
  plan_tier TEXT DEFAULT 'starter',
  hour_valuation_usd NUMERIC(8,2),
  created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'coordinator' CHECK (role IN ('owner', 'coordinator', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  skills_required TEXT[],
  location TEXT,
  remote BOOLEAN DEFAULT FALSE,
  time_commitment TEXT,
  start_date DATE,
  end_date DATE,
  deadline DATE,
  volunteers_needed INTEGER,
  volunteers_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- open, closed, filled
  requirements TEXT,
  benefits TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed, withdrawn
  cover_letter TEXT,
  availability TEXT,
  experience TEXT,
  no_show BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verification_code TEXT UNIQUE,
  supervisor_name TEXT,
  supervisor_title TEXT,
  supervisor_email TEXT,
  supervisor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (opportunity_id, user_id)
);

CREATE TABLE volunteer_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_code TEXT UNIQUE,
  supervisor_name TEXT,
  supervisor_title TEXT,
  supervisor_email TEXT,
  supervisor_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE volunteer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  volunteer_hours_id UUID REFERENCES volunteer_hours(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coordinator_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  path TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);

CREATE TABLE skill_competency_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  score_percent INTEGER NOT NULL CHECK (score_percent BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  passed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  best_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, skill_key)
);

CREATE TABLE skill_competency_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  score_percent INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kept so legacy admin/org pages type-check and query safely; not part of the core loop.
CREATE TABLE id_verification_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_first_name TEXT NOT NULL,
  legal_last_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_path TEXT NOT NULL,
  selfie_path TEXT,
  attestation_text TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewer_attestation TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  certificate_code TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE org_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE org_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE TABLE community_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE shared_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  share_url TEXT,
  post_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ───────────────────────── Indexes ─────────────────────────

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_volunteer_hours_user_id ON volunteer_hours(user_id);
CREATE INDEX idx_volunteer_hours_opportunity_id ON volunteer_hours(opportunity_id);
CREATE INDEX idx_reviews_volunteer ON volunteer_reviews(volunteer_id);
CREATE INDEX app_events_user_created_idx ON app_events(user_id, created_at DESC);
CREATE INDEX app_events_org_created_idx ON app_events(organization_id, created_at DESC);

-- ───────────────────────── Helper functions ─────────────────────────

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_platform_admin FROM profiles WHERE id = auth.uid()), false);
$$;

CREATE OR REPLACE FUNCTION public.is_org_manager(org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'coordinator')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_opportunity_manager(opp_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM opportunities o
    WHERE o.id = opp_id AND public.is_org_manager(o.organization_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_claim_new_org(org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND created_by = auth.uid())
     AND NOT EXISTS (SELECT 1 FROM organization_members WHERE organization_id = org_id);
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- New auth user → profile row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Users cannot grant themselves admin or ID-verified status.
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    NEW.is_platform_admin := OLD.is_platform_admin;
    NEW.id_verification_status := OLD.id_verification_status;
    NEW.id_certificate_code := OLD.id_certificate_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_profile_privileged_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_profile_privileged_fields();

CREATE OR REPLACE FUNCTION public.guard_organization_verified_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
      NEW.verified := false;
      NEW.created_by := auth.uid();
    END IF;
  ELSIF NEW.verified IS DISTINCT FROM OLD.verified
        AND auth.uid() IS NOT NULL AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can change organization verification status';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_organization_verified_change
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION guard_organization_verified_change();

-- Volunteers may only edit their own unverified fields; verification is reserved for the event's coordinators.
CREATE OR REPLACE FUNCTION public.guard_application_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_opportunity_manager(OLD.opportunity_id) OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'withdrawn' THEN
    RAISE EXCEPTION 'Only event coordinators can change application status';
  END IF;
  IF NEW.verification_code IS DISTINCT FROM OLD.verification_code
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR NEW.no_show IS DISTINCT FROM OLD.no_show THEN
    RAISE EXCEPTION 'Only event coordinators can verify completions';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_application_update
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION guard_application_update();

-- Keep volunteers_count in sync with active sign-ups.
CREATE OR REPLACE FUNCTION public.sync_volunteers_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  opp uuid := COALESCE(NEW.opportunity_id, OLD.opportunity_id);
BEGIN
  UPDATE opportunities
     SET volunteers_count = (
       SELECT count(*) FROM applications
       WHERE opportunity_id = opp AND status IN ('pending', 'accepted', 'completed')
     )
   WHERE id = opp;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_volunteers_count
  AFTER INSERT OR UPDATE OF status OR DELETE ON applications
  FOR EACH ROW EXECUTE FUNCTION sync_volunteers_count();

-- ───────────────────────── RPCs ─────────────────────────

CREATE OR REPLACE FUNCTION public.join_opportunity(p_opportunity_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  opp opportunities%ROWTYPE;
  existing applications%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth');
  END IF;

  SELECT * INTO opp FROM opportunities WHERE id = p_opportunity_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO existing FROM applications WHERE opportunity_id = p_opportunity_id AND user_id = uid;
  IF FOUND AND existing.status IN ('pending', 'accepted', 'completed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_joined');
  END IF;

  IF COALESCE(opp.status, 'open') <> 'open' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'closed');
  END IF;

  IF opp.volunteers_needed IS NOT NULL AND (
       SELECT count(*) FROM applications
       WHERE opportunity_id = p_opportunity_id AND status IN ('pending', 'accepted', 'completed')
     ) >= opp.volunteers_needed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'full');
  END IF;

  IF FOUND THEN
    UPDATE applications SET status = 'accepted', no_show = false WHERE id = existing.id;
  ELSE
    INSERT INTO applications (opportunity_id, user_id, status) VALUES (p_opportunity_id, uid, 'accepted');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_opportunity(p_opportunity_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'auth');
  END IF;

  DELETE FROM applications
   WHERE opportunity_id = p_opportunity_id
     AND user_id = uid
     AND status IN ('pending', 'accepted', 'withdrawn', 'rejected');

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_joined');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.join_opportunity(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.leave_opportunity(uuid) FROM anon;

-- ───────────────────────── Row Level Security ─────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_competency_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_competency_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_posts ENABLE ROW LEVEL SECURITY;

-- profiles: names are public (passport/verify pages); contact details hidden from anonymous visitors.
CREATE POLICY "Profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins update profiles" ON profiles FOR UPDATE TO authenticated USING (public.is_platform_admin());

REVOKE SELECT ON profiles FROM anon;
GRANT SELECT (id, full_name, avatar_url, bio, skills, location, id_verification_status, created_at) ON profiles TO anon;

-- organizations
CREATE POLICY "Anyone can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Signed-in users create organizations" ON organizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Managers or admins update organizations" ON organizations FOR UPDATE TO authenticated
  USING (public.is_org_manager(id) OR public.is_platform_admin())
  WITH CHECK (public.is_org_manager(id) OR public.is_platform_admin());
CREATE POLICY "Owners or admins delete organizations" ON organizations FOR DELETE TO authenticated
  USING (
    public.is_platform_admin() OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id AND om.user_id = auth.uid() AND om.role = 'owner'
    )
  );

-- organization_members: the creator of a brand-new org becomes its owner; afterwards managers add people.
CREATE POLICY "Anyone can view org members" ON organization_members FOR SELECT USING (true);
CREATE POLICY "Founder claims new org or managers add members" ON organization_members FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND role = 'owner' AND public.can_claim_new_org(organization_id))
    OR public.is_org_manager(organization_id)
    OR public.is_platform_admin()
  );
CREATE POLICY "Managers update members" ON organization_members FOR UPDATE TO authenticated
  USING (public.is_org_manager(organization_id) OR public.is_platform_admin());
CREATE POLICY "Managers remove members or self leave" ON organization_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_org_manager(organization_id) OR public.is_platform_admin());

-- opportunities
CREATE POLICY "Anyone can view opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Org managers create opportunities" ON opportunities FOR INSERT TO authenticated
  WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "Org managers update opportunities" ON opportunities FOR UPDATE TO authenticated
  USING (public.is_org_manager(organization_id)) WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "Org managers delete opportunities" ON opportunities FOR DELETE TO authenticated
  USING (public.is_org_manager(organization_id));

-- applications
CREATE POLICY "Volunteers see own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers see event applications" ON applications FOR SELECT TO authenticated
  USING (public.is_opportunity_manager(opportunity_id));
CREATE POLICY "Verified completions are public" ON applications FOR SELECT
  USING (status = 'completed' AND verification_code IS NOT NULL);
CREATE POLICY "Volunteers apply for themselves" ON applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND COALESCE(status, 'pending') = 'pending' AND verification_code IS NULL);
CREATE POLICY "Volunteers update own applications" ON applications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers update event applications" ON applications FOR UPDATE TO authenticated
  USING (public.is_opportunity_manager(opportunity_id));
CREATE POLICY "Volunteers withdraw own pending applications" ON applications FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status <> 'completed');

-- volunteer_hours
CREATE POLICY "Volunteers see own hours" ON volunteer_hours FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers see event hours" ON volunteer_hours FOR SELECT TO authenticated
  USING (public.is_opportunity_manager(opportunity_id));
CREATE POLICY "Verified hours are public" ON volunteer_hours FOR SELECT
  USING (verified = true AND verification_code IS NOT NULL);
CREATE POLICY "Volunteers log own unverified hours" ON volunteer_hours FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND COALESCE(verified, false) = false
    AND verification_code IS NULL
    AND verified_by IS NULL
    AND EXISTS (
      SELECT 1 FROM applications a
      WHERE a.opportunity_id = volunteer_hours.opportunity_id
        AND a.user_id = auth.uid()
        AND a.status IN ('accepted', 'completed')
    )
  );
CREATE POLICY "Managers verify event hours" ON volunteer_hours FOR UPDATE TO authenticated
  USING (public.is_opportunity_manager(opportunity_id))
  WITH CHECK (public.is_opportunity_manager(opportunity_id));
CREATE POLICY "Volunteers delete own unverified hours" ON volunteer_hours FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND COALESCE(verified, false) = false);

-- volunteer_reviews
CREATE POLICY "Reviews are public" ON volunteer_reviews FOR SELECT USING (true);
CREATE POLICY "Managers write reviews" ON volunteer_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid() AND public.is_org_manager(organization_id));
CREATE POLICY "Reviewers edit own reviews" ON volunteer_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

-- coordinator_requests
CREATE POLICY "Requesters and managers view requests" ON coordinator_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_org_manager(organization_id) OR public.is_platform_admin());
CREATE POLICY "Users request access" ON coordinator_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Managers review requests" ON coordinator_requests FOR UPDATE TO authenticated
  USING (public.is_org_manager(organization_id) OR public.is_platform_admin());

-- security_audit_log
CREATE POLICY "Users write own audit entries" ON security_audit_log FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Users read own audit entries" ON security_audit_log FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

-- app_events
CREATE POLICY "Users insert app events" ON app_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Anon insert public passport views" ON app_events FOR INSERT TO anon
  WITH CHECK (event_name = 'public_passport.view' AND user_id IS NULL);
CREATE POLICY "Users read own app events" ON app_events FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Org managers read org app events" ON app_events FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_manager(organization_id));

-- badges and competency
CREATE POLICY "Badges are public" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Users earn own badges" ON user_badges FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users read own competency results" ON skill_competency_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read passed competency results" ON skill_competency_results FOR SELECT USING (passed = true);
CREATE POLICY "Users insert own competency results" ON skill_competency_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own competency results" ON skill_competency_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users read own competency attempts" ON skill_competency_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own competency attempts" ON skill_competency_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- id verification (feature disabled in the UI; admin-only access kept for safety)
CREATE POLICY "Users view own ID submissions" ON id_verification_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY "Admins review ID submissions" ON id_verification_submissions FOR UPDATE TO authenticated
  USING (public.is_platform_admin());

-- org integrations
CREATE POLICY "Managers manage API keys" ON org_api_keys FOR ALL TO authenticated
  USING (public.is_org_manager(organization_id)) WITH CHECK (public.is_org_manager(organization_id));
CREATE POLICY "Managers manage webhooks" ON org_webhooks FOR ALL TO authenticated
  USING (public.is_org_manager(organization_id)) WITH CHECK (public.is_org_manager(organization_id));

-- retired social features: own rows only
CREATE POLICY "Parties view transfers" ON transfer_requests FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Public groups are visible" ON community_groups FOR SELECT USING (is_public OR created_by = auth.uid());
CREATE POLICY "Members view memberships" ON group_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authors view own posts" ON shared_posts FOR SELECT TO authenticated USING (author_id = auth.uid());
