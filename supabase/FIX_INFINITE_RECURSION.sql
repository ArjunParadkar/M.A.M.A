-- =============================================================================
-- FIX: Infinite Recursion in profiles RLS Policy
-- =============================================================================
-- This fixes the "infinite recursion detected in policy for relation 'profiles'"
-- error when completing a profile.
--
-- The issue: The admin policy was querying the profiles table from within
-- the same table's RLS check, creating a circular dependency.
--
-- Solution: Use a SECURITY DEFINER function that bypasses RLS to check
-- admin status safely.
-- =============================================================================

-- 1. Create helper function to check admin status (bypasses RLS)
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

-- 2. Drop and recreate the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- =============================================================================
-- Verification:
-- After running this, try completing a profile again. The error should be gone.
-- =============================================================================

