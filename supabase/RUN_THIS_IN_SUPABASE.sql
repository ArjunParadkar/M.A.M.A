-- =============================================================================
-- M.A.M.A - RUN THIS IN SUPABASE SQL EDITOR (one-time setup)
-- Copy-paste this entire file into: Supabase Dashboard → SQL Editor → New query
-- Then click Run.
-- =============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom types (ignore if already exist)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'manufacturer', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE tolerance_tier AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('draft','posted','assigned','in_production','qc_pending','qc_done','accepted','disputed','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE qc_status AS ENUM ('pass', 'review', 'fail');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE dispute_status AS ENUM ('open', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Core tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manufacturers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  location_state TEXT NOT NULL,
  location_zip TEXT NOT NULL,
  equipment JSONB NOT NULL DEFAULT '{}',
  materials TEXT[] NOT NULL DEFAULT '{}',
  tolerance_tier tolerance_tier NOT NULL DEFAULT 'medium',
  capacity_score FLOAT NOT NULL DEFAULT 0.5 CHECK (capacity_score >= 0 AND capacity_score <= 1),
  quality_score FLOAT NOT NULL DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  material TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  tolerance_tier tolerance_tier NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status job_status NOT NULL DEFAULT 'draft',
  selected_manufacturer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stl_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank_score FLOAT NOT NULL CHECK (rank_score >= 0 AND rank_score <= 1),
  explanations JSONB NOT NULL DEFAULT '{}',
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, manufacturer_id)
);

CREATE TABLE IF NOT EXISTS pay_estimates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  suggested_pay FLOAT NOT NULL CHECK (suggested_pay >= 0),
  range_low FLOAT NOT NULL CHECK (range_low >= 0),
  range_high FLOAT NOT NULL CHECK (range_high >= 0),
  breakdown JSONB NOT NULL DEFAULT '{}',
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS qc_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qc_score FLOAT NOT NULL CHECK (qc_score >= 0 AND qc_score <= 1),
  status qc_status NOT NULL,
  similarity FLOAT NOT NULL CHECK (similarity >= 0 AND similarity <= 1),
  evidence_paths TEXT[] NOT NULL DEFAULT '{}',
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. Profile & manufacturer extra columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_type TEXT;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_client_type_check;  -- allow individual, small_business, corporation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating FLOAT DEFAULT 0.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ratings_received INTEGER DEFAULT 0;

ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS average_rating FLOAT DEFAULT 0.0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS total_ratings_received INTEGER DEFAULT 0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS total_earnings FLOAT DEFAULT 0.0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS quality_score FLOAT DEFAULT 0.5 CHECK (quality_score >= 0 AND quality_score <= 1);

-- 5. Manufacturer devices
CREATE TABLE IF NOT EXISTS manufacturer_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_model TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  capabilities JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- 7. Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_manufacturers_updated_at ON manufacturers;
CREATE TRIGGER update_manufacturers_updated_at BEFORE UPDATE ON manufacturers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_manufacturer_devices_updated_at ON manufacturer_devices;
CREATE TRIGGER update_manufacturer_devices_updated_at BEFORE UPDATE ON manufacturer_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Backfill: create profile for existing auth.users that don't have one
INSERT INTO public.profiles (id, email, name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email,'@',1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 10. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies to avoid duplicates, then create
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Manufacturers can view their own data" ON manufacturers;
DROP POLICY IF EXISTS "Manufacturers can update their own data" ON manufacturers;
DROP POLICY IF EXISTS "Manufacturers can insert their own data" ON manufacturers;
DROP POLICY IF EXISTS "Anyone can view manufacturers" ON manufacturers;
CREATE POLICY "Manufacturers can view their own data" ON manufacturers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Manufacturers can update their own data" ON manufacturers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Manufacturers can insert their own data" ON manufacturers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can view manufacturers" ON manufacturers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manufacturers can view their own devices" ON manufacturer_devices;
DROP POLICY IF EXISTS "Manufacturers can insert their own devices" ON manufacturer_devices;
DROP POLICY IF EXISTS "Manufacturers can update their own devices" ON manufacturer_devices;
DROP POLICY IF EXISTS "Manufacturers can delete their own devices" ON manufacturer_devices;
CREATE POLICY "Manufacturers can view their own devices" ON manufacturer_devices FOR SELECT USING (EXISTS (SELECT 1 FROM manufacturers m WHERE m.id = manufacturer_devices.manufacturer_id AND m.id = auth.uid()));
CREATE POLICY "Manufacturers can insert their own devices" ON manufacturer_devices FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM manufacturers m WHERE m.id = manufacturer_devices.manufacturer_id AND m.id = auth.uid()));
CREATE POLICY "Manufacturers can update their own devices" ON manufacturer_devices FOR UPDATE USING (EXISTS (SELECT 1 FROM manufacturers m WHERE m.id = manufacturer_devices.manufacturer_id AND m.id = auth.uid()));
CREATE POLICY "Manufacturers can delete their own devices" ON manufacturer_devices FOR DELETE USING (EXISTS (SELECT 1 FROM manufacturers m WHERE m.id = manufacturer_devices.manufacturer_id AND m.id = auth.uid()));

-- Jobs, job_recommendations, pay_estimates, qc_records, disputes (minimal for profile completion to work)
DROP POLICY IF EXISTS "Clients can view their own jobs" ON jobs;
DROP POLICY IF EXISTS "Clients can create their own jobs" ON jobs;
DROP POLICY IF EXISTS "Clients can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Manufacturers can view assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Manufacturers can update assigned jobs" ON jobs;
CREATE POLICY "Clients can view their own jobs" ON jobs FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients can create their own jobs" ON jobs FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Clients can update their own jobs" ON jobs FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "Manufacturers can view assigned jobs" ON jobs FOR SELECT USING (selected_manufacturer_id = auth.uid());
CREATE POLICY "Manufacturers can update assigned jobs" ON jobs FOR UPDATE USING (selected_manufacturer_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_manufacturer_devices_manufacturer_id ON manufacturer_devices(manufacturer_id);

-- Allow manufacturers.upsert to work when manufacturer row doesn't exist: INSERT requires valid id=profiles.id. 
-- Manufacturers.id = profiles.id, so we need a profile first. The form does: 1) update profiles, 2) upsert manufacturers.
-- For upsert, if no row exists, INSERT runs. We need INSERT policy (done above).
-- For manufacturers, location_state and location_zip are NOT NULL. In our form we always send state and zip. Good.

-- =============================================================================
-- 11. Messaging + Shipping + Financials (004)
-- =============================================================================

-- 11.1 Extend jobs with fields needed to connect client↔manufacturer and preserve order details
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS order_type TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tolerance_thou FLOAT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS manufacturing_types TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS finish_details TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS coatings TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS screw_dimensions TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS paint_color TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS stl_url TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assigned_quantity INTEGER;

-- 11.2 Job messages (client ↔ manufacturer)
CREATE TABLE IF NOT EXISTS public.job_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_messages_job_id_created_at ON public.job_messages(job_id, created_at);
CREATE INDEX IF NOT EXISTS idx_job_messages_sender_id ON public.job_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_recipient_id ON public.job_messages(recipient_id);

ALTER TABLE public.job_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read job messages" ON public.job_messages;
CREATE POLICY "Participants can read job messages"
ON public.job_messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

DROP POLICY IF EXISTS "Participants can send job messages" ON public.job_messages;
CREATE POLICY "Participants can send job messages"
ON public.job_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_messages.job_id
      AND (
        (j.client_id = job_messages.sender_id AND j.selected_manufacturer_id = job_messages.recipient_id)
        OR
        (j.client_id = job_messages.recipient_id AND j.selected_manufacturer_id = job_messages.sender_id)
      )
  )
);

-- 11.3 Shipping records (manufacturer submits tracking)
CREATE TABLE IF NOT EXISTS public.shipping_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_number TEXT NOT NULL,
  shipped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.shipping_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read shipping" ON public.shipping_records;
CREATE POLICY "Participants can read shipping"
ON public.shipping_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = shipping_records.job_id
      AND (j.client_id = auth.uid() OR j.selected_manufacturer_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Manufacturer can create shipping" ON public.shipping_records;
CREATE POLICY "Manufacturer can create shipping"
ON public.shipping_records
FOR INSERT
WITH CHECK (
  auth.uid() = manufacturer_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = shipping_records.job_id
      AND j.selected_manufacturer_id = auth.uid()
  )
);

-- 11.4 Financial transactions (demo ledger)
DO $$ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.transaction_status NOT NULL DEFAULT 'pending',
  kind TEXT NOT NULL DEFAULT 'job_payment',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_id_created_at ON public.financial_transactions(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_manufacturer_id_created_at ON public.financial_transactions(manufacturer_id, created_at);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read financials" ON public.financial_transactions;
CREATE POLICY "Participants can read financials"
ON public.financial_transactions
FOR SELECT
USING (
  auth.uid() = client_id OR auth.uid() = manufacturer_id
);

DROP POLICY IF EXISTS "Client can create pending financials" ON public.financial_transactions;
CREATE POLICY "Client can create pending financials"
ON public.financial_transactions
FOR INSERT
WITH CHECK (
  auth.uid() = client_id
  AND status = 'pending'
);

DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 12. Job Assignments for Multi-Manufacturer Open Requests (005)
-- =============================================================================

-- For large open requests, multiple manufacturers can each accept a portion.
-- This table tracks each manufacturer's assignment (quantity, delivery date, status).

CREATE TABLE IF NOT EXISTS public.job_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_quantity INTEGER NOT NULL CHECK (assigned_quantity > 0),
  estimated_delivery_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'in_production', 'qc_pending', 'shipped', 'delivered', 'cancelled')),
  completed_quantity INTEGER NOT NULL DEFAULT 0 CHECK (completed_quantity >= 0),
  pay_amount_cents INTEGER NOT NULL CHECK (pay_amount_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, manufacturer_id) -- One assignment per manufacturer per job
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_job_id ON public.job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_manufacturer_id ON public.job_assignments(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_status ON public.job_assignments(status);

ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- Clients can view assignments for their jobs
DROP POLICY IF EXISTS "Clients can view their job assignments" ON public.job_assignments;
CREATE POLICY "Clients can view their job assignments"
ON public.job_assignments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_assignments.job_id
      AND j.client_id = auth.uid()
  )
);

-- Manufacturers can view their own assignments
DROP POLICY IF EXISTS "Manufacturers can view their assignments" ON public.job_assignments;
CREATE POLICY "Manufacturers can view their assignments"
ON public.job_assignments
FOR SELECT
USING (auth.uid() = manufacturer_id);

-- Manufacturers can create assignments when accepting open requests
DROP POLICY IF EXISTS "Manufacturers can create assignments" ON public.job_assignments;
CREATE POLICY "Manufacturers can create assignments"
ON public.job_assignments
FOR INSERT
WITH CHECK (
  auth.uid() = manufacturer_id
  AND EXISTS (
    SELECT 1
    FROM public.jobs j
    WHERE j.id = job_assignments.job_id
      AND j.order_type = 'open-request'
      AND j.status IN ('posted', 'assigned')
      -- Check that total assigned doesn't exceed job quantity
      AND (
        SELECT COALESCE(SUM(ja.assigned_quantity), 0)
        FROM public.job_assignments ja
        WHERE ja.job_id = j.id
      ) + job_assignments.assigned_quantity <= j.quantity
  )
);

-- Manufacturers can update their own assignments (progress, status)
DROP POLICY IF EXISTS "Manufacturers can update their assignments" ON public.job_assignments;
CREATE POLICY "Manufacturers can update their assignments"
ON public.job_assignments
FOR UPDATE
USING (auth.uid() = manufacturer_id);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_job_assignments_updated_at ON public.job_assignments;
CREATE TRIGGER update_job_assignments_updated_at
BEFORE UPDATE ON public.job_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

