-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  skills TEXT[],
  location TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  location TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Volunteer opportunities table
CREATE TABLE opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
  cover_letter TEXT,
  availability TEXT,
  experience TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(opportunity_id, user_id)
);

-- Volunteer hours tracking
CREATE TABLE volunteer_hours (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours DECIMAL(5,2) NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_opportunities_organization_id ON opportunities(organization_id);
CREATE INDEX idx_opportunities_category ON opportunities(category);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_volunteer_hours_user_id ON volunteer_hours(user_id);
CREATE INDEX idx_volunteer_hours_opportunity_id ON volunteer_hours(opportunity_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for organizations
CREATE POLICY "Anyone can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION public.is_org_manager(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'coordinator')
  );
$$;

CREATE OR REPLACE FUNCTION public.guard_organization_verified_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Only platform admins can change organization verification status';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_organization_verified_change
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION guard_organization_verified_change();

CREATE POLICY "Platform admins can update organizations" ON organizations FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Org managers can update organization details" ON organizations FOR UPDATE
  TO authenticated
  USING (public.is_org_manager(id))
  WITH CHECK (public.is_org_manager(id));

CREATE POLICY "Org owners can delete organizations" ON organizations FOR DELETE
  TO authenticated
  USING (
    public.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- RLS Policies for opportunities
CREATE POLICY "Anyone can view opportunities" ON opportunities FOR SELECT USING (true);
CREATE POLICY "Verified organizations can create opportunities" ON opportunities FOR INSERT WITH CHECK (true); -- Add verification logic
CREATE POLICY "Organization owners can update opportunities" ON opportunities FOR UPDATE USING (true);
CREATE POLICY "Organization owners can delete opportunities" ON opportunities FOR DELETE USING (true);

-- RLS Policies for applications
CREATE POLICY "Users can view own applications" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organizations can view applications for their opportunities" ON applications FOR SELECT USING (true); -- Add org check
CREATE POLICY "Users can create applications" ON applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Organizations can update application status" ON applications FOR UPDATE USING (true); -- Add org check

-- RLS Policies for volunteer_hours
CREATE POLICY "Users can view own hours" ON volunteer_hours FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hours" ON volunteer_hours FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Verifiers can update hours" ON volunteer_hours FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Skill competency verification
CREATE TABLE IF NOT EXISTS skill_competency_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  score_percent INTEGER NOT NULL CHECK (score_percent >= 0 AND score_percent <= 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  passed_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  best_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, skill_key)
);

CREATE TABLE IF NOT EXISTS skill_competency_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL,
  score_percent INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skill_competency_results_user_idx ON skill_competency_results(user_id);

ALTER TABLE skill_competency_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_competency_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own competency results" ON skill_competency_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read passed competency results" ON skill_competency_results
  FOR SELECT USING (passed = true);
CREATE POLICY "Users insert own competency results" ON skill_competency_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own competency results" ON skill_competency_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own competency attempts" ON skill_competency_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own competency attempts" ON skill_competency_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Silent product analytics (surfaced via analytics dashboards only)
CREATE TABLE IF NOT EXISTS app_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  path TEXT,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_events_user_created_idx ON app_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_events_org_created_idx ON app_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_events_name_created_idx ON app_events(event_name, created_at DESC);

ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert app events" ON app_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Anon insert public passport views" ON app_events
  FOR INSERT TO anon
  WITH CHECK (event_name = 'public_passport.view');

CREATE POLICY "Users read own app events" ON app_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin());

CREATE POLICY "Org managers read org app events" ON app_events
  FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_manager(organization_id));
