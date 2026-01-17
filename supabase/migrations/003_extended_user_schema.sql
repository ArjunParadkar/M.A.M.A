-- Extended User Schema for Payment Methods, Ratings, Job History
-- Migration for comprehensive user data management

-- Payment Methods Table (Secure - encrypted at application level)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  method_type TEXT NOT NULL CHECK (method_type IN ('bank_account', 'paypal', 'venmo', 'zelle', 'cashapp', 'crypto')),
  account_name TEXT NOT NULL,
  account_details JSONB NOT NULL DEFAULT '{}', -- Encrypted payment details
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one default per user
  CONSTRAINT unique_default_payment UNIQUE(user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- Ratings Table (for both manufacturers and clients)
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Who is giving the rating
  ratee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Who is being rated
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  category TEXT CHECK (category IN ('quality', 'timeliness', 'communication', 'overall')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one rating per job per rater
  UNIQUE(job_id, rater_id, category)
);

-- Job History / Previously Done Jobs (denormalized for quick access)
CREATE TABLE IF NOT EXISTS job_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_role user_role NOT NULL,
  job_title TEXT NOT NULL,
  job_status job_status NOT NULL,
  completed_at TIMESTAMPTZ,
  payment_amount FLOAT,
  rating_given INTEGER CHECK (rating_given >= 1 AND rating_given <= 5),
  rating_received INTEGER CHECK (rating_received >= 1 AND rating_received <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Index for quick lookups
  UNIQUE(job_id, user_id)
);

-- Ongoing Processes / Active Jobs Tracking
CREATE TABLE IF NOT EXISTS active_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  manufacturer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_completion TIMESTAMPTZ,
  status job_status NOT NULL DEFAULT 'in_production',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(job_id, manufacturer_id)
);

-- Client Preferences / Additional Info
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_rating FLOAT DEFAULT 0.0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_ratings_received INTEGER DEFAULT 0;

-- Manufacturer Additional Stats
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS average_rating FLOAT DEFAULT 0.0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS total_ratings_received INTEGER DEFAULT 0;
ALTER TABLE manufacturers ADD COLUMN IF NOT EXISTS total_earnings FLOAT DEFAULT 0.0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_job_id ON ratings(job_id);

CREATE INDEX IF NOT EXISTS idx_job_history_user_id ON job_history(user_id);
CREATE INDEX IF NOT EXISTS idx_job_history_user_role ON job_history(user_id, user_role);
CREATE INDEX IF NOT EXISTS idx_job_history_status ON job_history(job_status);

CREATE INDEX IF NOT EXISTS idx_active_jobs_manufacturer_id ON active_jobs(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_active_jobs_client_id ON active_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_active_jobs_status ON active_jobs(status);

-- RLS Policies for Payment Methods
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment methods"
  ON payment_methods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment methods"
  ON payment_methods FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment methods"
  ON payment_methods FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payment methods"
  ON payment_methods FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for Ratings
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings they gave or received"
  ON ratings FOR SELECT
  USING (rater_id = auth.uid() OR ratee_id = auth.uid());

CREATE POLICY "Users can create ratings for jobs they were involved in"
  ON ratings FOR INSERT
  WITH CHECK (
    rater_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = ratings.job_id
      AND (jobs.client_id = auth.uid() OR jobs.selected_manufacturer_id = auth.uid())
    )
  );

CREATE POLICY "Users can update ratings they gave"
  ON ratings FOR UPDATE
  USING (rater_id = auth.uid());

-- RLS Policies for Job History
ALTER TABLE job_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job history"
  ON job_history FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies for Active Jobs
ALTER TABLE active_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manufacturers can view their active jobs"
  ON active_jobs FOR SELECT
  USING (manufacturer_id = auth.uid());

CREATE POLICY "Clients can view their active jobs"
  ON active_jobs FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Manufacturers can update their active jobs"
  ON active_jobs FOR UPDATE
  USING (manufacturer_id = auth.uid());

-- Function to update ratings averages
CREATE OR REPLACE FUNCTION update_user_rating_average()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile average rating
  UPDATE profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating)::FLOAT, 0.0)
      FROM ratings
      WHERE ratee_id = NEW.ratee_id
    ),
    total_ratings_received = (
      SELECT COUNT(*)
      FROM ratings
      WHERE ratee_id = NEW.ratee_id
    )
  WHERE id = NEW.ratee_id;

  -- Update manufacturer stats if applicable
  IF EXISTS (SELECT 1 FROM manufacturers WHERE id = NEW.ratee_id) THEN
    UPDATE manufacturers
    SET 
      average_rating = (
        SELECT COALESCE(AVG(rating)::FLOAT, 0.0)
        FROM ratings
        WHERE ratee_id = NEW.ratee_id
      ),
      total_ratings_received = (
        SELECT COUNT(*)
        FROM ratings
        WHERE ratee_id = NEW.ratee_id
      )
    WHERE id = NEW.ratee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings when new rating is added
DROP TRIGGER IF EXISTS trigger_update_rating_average ON ratings;
CREATE TRIGGER trigger_update_rating_average
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating_average();

-- Trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at 
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at 
  BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_jobs_updated_at 
  BEFORE UPDATE ON active_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent duplicate default payment methods
CREATE OR REPLACE FUNCTION ensure_single_default_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id 
    AND id != NEW.id 
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_payment_trigger
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_payment();
