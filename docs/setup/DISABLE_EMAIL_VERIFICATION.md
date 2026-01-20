# Disable Email Verification in Supabase

## Quick Steps

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/aywrgbfuoldtoeecsbvu

2. **Navigate to Authentication Settings:**
   - Click **"Authentication"** in the left sidebar
   - Click **"Settings"** (or go to Authentication → Providers → Email)

3. **Disable Email Confirmation:**
   - Find **"Enable email confirmations"** toggle
   - **Turn it OFF** (unchecked)
   - Optionally: **"Enable sign ups"** should be ON (checked)

4. **Auto-Confirm Users (Optional but Recommended):**
   - Run this SQL in Supabase SQL Editor to auto-confirm all existing and future users:

```sql
-- Auto-confirm all existing users
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Create function to auto-confirm new users
CREATE OR REPLACE FUNCTION public.handle_new_user_autoconfirm()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
    AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm on sign-up
DROP TRIGGER IF EXISTS on_auth_user_created_autoconfirm ON auth.users;
CREATE TRIGGER on_auth_user_created_autoconfirm
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_autoconfirm();
```

5. **Save Settings:**
   - Click **"Save"** if there's a save button
   - Changes take effect immediately

## What This Does

- **New sign-ups:** Users can sign up and immediately access their account without email confirmation
- **Existing users:** Any unconfirmed users are automatically confirmed
- **Future users:** All new sign-ups are automatically confirmed via the trigger

## Testing

After making these changes:
1. Sign up with a new email address
2. You should be redirected directly to the complete profile page
3. After completing profile, you'll go straight to your dashboard
4. No email confirmation step required!

## Re-enabling Email Verification (if needed later)

1. Turn **"Enable email confirmations"** back ON in Authentication settings
2. Remove the trigger:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created_autoconfirm ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_autoconfirm();
```

