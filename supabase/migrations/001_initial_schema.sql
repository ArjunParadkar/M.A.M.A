-- ForgeNet Initial Database Schema
-- Supabase/Postgres migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'manufacturer', 'admin');
CREATE TYPE tolerance_tier AS ENUM ('low', 'medium', 'high');
CREATE TYPE job_status AS ENUM (
  'draft',
  'posted',
  'assigned',
  'in_production',
  'qc_pending',
  'qc_done',
  'accepted',
  'disputed',
  'resolved'
);
CREATE TYPE qc_status AS ENUM ('pass', 'review', 'fail');
CREATE TYPE dispute_status AS ENUM ('open', 'resolved');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Manufacturers table (extends profiles)
CREATE TABLE manufacturers (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  location_state TEXT NOT NULL,
  location_zip TEXT NOT NULL,
  equipment JSONB NOT NULL DEFAULT '{}',
  materials TEXT[] NOT NULL DEFAULT '{}',
  tolerance_tier tolerance_tier NOT NULL DEFAULT 'medium',
  capacity_score FLOAT NOT NULL DEFAULT 0.5 CHECK (capacity_score >= 0 AND capacity_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs table
CREATE TABLE jobs (
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

-- Job recommendations table (F1 output)
CREATE TABLE job_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank_score FLOAT NOT NULL CHECK (rank_score >= 0 AND rank_score <= 1),
  explanations JSONB NOT NULL DEFAULT '{}',
  model_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(job_id, manufacturer_id)
);

-- Pay estimates table (F2 output)
CREATE TABLE pay_estimates (
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

-- QC records table (F3 output)
CREATE TABLE qc_records (
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

-- Disputes table
CREATE TABLE disputes (
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

-- Create indexes for performance
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_selected_manufacturer_id ON jobs(selected_manufacturer_id);
CREATE INDEX idx_job_recommendations_job_id ON job_recommendations(job_id);
CREATE INDEX idx_job_recommendations_manufacturer_id ON job_recommendations(manufacturer_id);
CREATE INDEX idx_pay_estimates_job_id ON pay_estimates(job_id);
CREATE INDEX idx_qc_records_job_id ON qc_records(job_id);
CREATE INDEX idx_disputes_job_id ON disputes(job_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manufacturers_updated_at BEFORE UPDATE ON manufacturers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pay_estimates_updated_at BEFORE UPDATE ON pay_estimates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pay_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Manufacturers policies
CREATE POLICY "Manufacturers can view their own data"
  ON manufacturers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Manufacturers can update their own data"
  ON manufacturers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view manufacturers (for job matching)"
  ON manufacturers FOR SELECT
  USING (true);

-- Jobs policies
CREATE POLICY "Clients can view their own jobs"
  ON jobs FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Clients can create their own jobs"
  ON jobs FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update their own jobs"
  ON jobs FOR UPDATE
  USING (client_id = auth.uid());

CREATE POLICY "Manufacturers can view jobs assigned to them"
  ON jobs FOR SELECT
  USING (
    selected_manufacturer_id = auth.uid()
    OR status IN ('posted', 'assigned')
  );

CREATE POLICY "Manufacturers can update jobs assigned to them"
  ON jobs FOR UPDATE
  USING (selected_manufacturer_id = auth.uid());

CREATE POLICY "Admins can view all jobs"
  ON jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Job recommendations policies
CREATE POLICY "Clients can view recommendations for their jobs"
  ON job_recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = job_recommendations.job_id
      AND jobs.client_id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can view recommendations for jobs they're in"
  ON job_recommendations FOR SELECT
  USING (manufacturer_id = auth.uid());

-- Pay estimates policies
CREATE POLICY "Clients can view pay estimates for their jobs"
  ON pay_estimates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = pay_estimates.job_id
      AND jobs.client_id = auth.uid()
    )
  );

-- QC records policies
CREATE POLICY "Clients can view QC for their jobs"
  ON qc_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = qc_records.job_id
      AND jobs.client_id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can view QC for their jobs"
  ON qc_records FOR SELECT
  USING (manufacturer_id = auth.uid());

-- Disputes policies
CREATE POLICY "Clients can view their disputes"
  ON disputes FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Manufacturers can view their disputes"
  ON disputes FOR SELECT
  USING (manufacturer_id = auth.uid());

CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can resolve disputes"
  ON disputes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
