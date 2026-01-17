-- Add device information and client type fields
-- Migration for authentication profile setup

-- Add client_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_type TEXT CHECK (client_type IN ('company', 'individual'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create devices table for manufacturers
CREATE TABLE IF NOT EXISTS manufacturer_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id UUID NOT NULL REFERENCES manufacturers(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  device_model TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  purchase_date DATE,
  capabilities JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for manufacturer devices
CREATE INDEX IF NOT EXISTS idx_manufacturer_devices_manufacturer_id ON manufacturer_devices(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_manufacturer_devices_status ON manufacturer_devices(status);

-- Add RLS policies for manufacturer_devices
ALTER TABLE manufacturer_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manufacturers can view their own devices"
  ON manufacturer_devices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM manufacturers
      WHERE manufacturers.id = manufacturer_devices.manufacturer_id
      AND manufacturers.id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can insert their own devices"
  ON manufacturer_devices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM manufacturers
      WHERE manufacturers.id = manufacturer_devices.manufacturer_id
      AND manufacturers.id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can update their own devices"
  ON manufacturer_devices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM manufacturers
      WHERE manufacturers.id = manufacturer_devices.manufacturer_id
      AND manufacturers.id = auth.uid()
    )
  );

CREATE POLICY "Manufacturers can delete their own devices"
  ON manufacturer_devices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM manufacturers
      WHERE manufacturers.id = manufacturer_devices.manufacturer_id
      AND manufacturers.id = auth.uid()
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at trigger for manufacturer_devices
CREATE TRIGGER update_manufacturer_devices_updated_at 
  BEFORE UPDATE ON manufacturer_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

