-- =============================================================================
-- AUTO-CONFIRM USERS (Disable Email Verification)
-- =============================================================================
-- This script auto-confirms all existing users and sets up a trigger to
-- auto-confirm all future sign-ups, bypassing email verification.
--
-- Run this in Supabase SQL Editor after disabling email confirmation
-- in Authentication → Settings → "Enable email confirmations" (turn OFF)
-- =============================================================================

-- 1. Auto-confirm all existing unconfirmed users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Create function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user's email immediately on sign-up
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
    AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS on_auth_user_created_autoconfirm ON auth.users;
CREATE TRIGGER on_auth_user_created_autoconfirm
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_autoconfirm();

-- =============================================================================
-- Verification:
-- After running this:
-- 1. Sign up with a new email
-- 2. User should be immediately confirmed (no email verification needed)
-- 3. User should be redirected directly to complete profile → dashboard
-- =============================================================================


