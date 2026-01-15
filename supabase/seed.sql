-- ForgeNet Seed Data
-- This creates sample data for demo purposes

-- Note: This assumes auth.users exist. In practice, you'd create users via Supabase Auth first,
-- then run this seed to populate profile data.

-- Sample Client Profile (replace 'client-uuid' with actual auth user UUID)
-- INSERT INTO profiles (id, role, name, email)
-- VALUES 
--   ('client-uuid-1', 'client', 'Acme Corp', 'client@acme.com'),
--   ('client-uuid-2', 'client', 'TechStart Inc', 'client@techstart.com');

-- Sample Manufacturer Profiles (replace 'mfr-uuid' with actual auth user UUIDs)
-- INSERT INTO profiles (id, role, name, email)
-- VALUES 
--   ('mfr-uuid-1', 'manufacturer', 'Precision Prints LLC', 'info@precisionprints.com'),
--   ('mfr-uuid-2', 'manufacturer', 'Rapid Manufacturing Co', 'sales@rapidmfg.com'),
--   ('mfr-uuid-3', 'manufacturer', 'Elite 3D Solutions', 'contact@elite3d.com');

-- Sample Manufacturer Details
-- INSERT INTO manufacturers (id, location_state, location_zip, equipment, materials, tolerance_tier, capacity_score)
-- VALUES 
--   (
--     'mfr-uuid-1',
--     'CA',
--     '90210',
--     '{"fdm": true, "sla": true, "cnc": false}',
--     ARRAY['PLA', 'ABS', 'PETG', 'Resin'],
--     'high',
--     0.9
--   ),
--   (
--     'mfr-uuid-2',
--     'TX',
--     '78701',
--     '{"fdm": true, "sla": false, "cnc": true}',
--     ARRAY['PLA', 'TPU', 'Nylon'],
--     'medium',
--     0.75
--   ),
--   (
--     'mfr-uuid-3',
--     'NY',
--     '10001',
--     '{"fdm": true, "sla": true, "cnc": true}',
--     ARRAY['PLA', 'ABS', 'Resin', 'Metal'],
--     'high',
--     0.85
--   );

-- Sample Admin Profile
-- INSERT INTO profiles (id, role, name, email)
-- VALUES 
--   ('admin-uuid-1', 'admin', 'Admin User', 'admin@forgenet.com');

-- Helper function to create a profile after user signup
-- This would be called via a Supabase trigger or edge function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email)
  VALUES (
    NEW.id,
    'client', -- default role
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample jobs (uncomment and replace UUIDs with actual values after creating users)
-- INSERT INTO jobs (
--   client_id,
--   title,
--   description,
--   material,
--   quantity,
--   tolerance_tier,
--   deadline,
--   status
-- )
-- VALUES 
--   (
--     'client-uuid-1',
--     'Bracket for Electronics Enclosure',
--     'Custom bracket to mount electronics board. Needs precise mounting holes.',
--     'PLA',
--     10,
--     'medium',
--     NOW() + INTERVAL '14 days',
--     'posted'
--   ),
--   (
--     'client-uuid-2',
--     'Prototype Housing',
--     'Small housing for IoT device prototype. High detail required.',
--     'Resin',
--     5,
--     'high',
--     NOW() + INTERVAL '7 days',
--     'posted'
--   );
