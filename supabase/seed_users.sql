-- Seed 100 Manufacturers and 100 Clients
-- This script creates example users for testing AI analysis and matching
-- Run this AFTER running RUN_THIS_IN_SUPABASE.sql

-- Note: This creates auth.users entries and profiles.
-- In production, you would use Supabase's admin API or create users through the sign-up flow.
-- For demo purposes, this provides test data.

-- First, create a function to generate random data
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER) RETURNS TEXT AS $$
  SELECT string_agg(substr('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 
    floor(random() * 62)::int + 1, 1), '') 
  FROM generate_series(1, length);
$$ LANGUAGE sql;

-- Create temporary table for users to insert
-- In actual implementation, use Supabase Auth Admin API
-- For now, this shows the structure of what needs to be created

-- Example manufacturer data structure (100 manufacturers)
-- Each manufacturer needs:
-- - Auth user (email: mfg_N@example.com, password: Password123!)
-- - Profile entry
-- - Manufacturer entry
-- - Manufacturer devices (2-5 devices each)
-- - Varied capacity_score (0.3 to 1.0)
-- - Varied quality_score (0.4 to 1.0)
-- - Different materials, tolerance tiers, locations

-- Example client data structure (100 clients)
-- Each client needs:
-- - Auth user (email: client_N@example.com, password: Password123!)
-- - Profile entry (mix of individual, small_business, corporation)

-- Since we can't directly create auth.users via SQL (requires Supabase Admin API),
-- this file documents the structure. See seed_users.py for actual implementation.

-- Device types and common devices (from manufacturingDevices.ts)
-- Use these when creating manufacturer_devices entries

COMMENT ON FUNCTION generate_random_string IS 'Helper function for generating random strings';

