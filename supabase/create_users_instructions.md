# Creating 100 Manufacturers and 100 Clients

## Status: ❌ Users NOT created yet

The seed script (`seed_users.py`) generates data but doesn't actually create users. You have two options:

## Option 1: Use Supabase Admin API (Recommended)

To create users programmatically, you need the **service_role key** (not the anon key).

1. Get your service_role key:
   - Go to Supabase Dashboard → Settings → API
   - Copy the **service_role** key (keep this secret!)

2. Set environment variables:
   ```bash
   export SUPABASE_URL="https://aywrgbfuoldtoeecsbvu.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

3. Install Python dependencies:
   ```bash
   pip install supabase
   ```

4. Run the script (once I update it to actually create users):
   ```bash
   python supabase/seed_users.py
   ```

## Option 2: Manual Creation via Sign-Up Flow

1. Sign up each user through the web app:
   - Go to `/auth/sign-up`
   - Create account as manufacturer or client
   - Complete profile

2. This is tedious for 200 users, so Option 1 is better.

## Option 3: Use Supabase Dashboard (Limited)

Supabase Dashboard → Authentication → Users → "Add user"
- Still requires manual work
- Limited to a few users at a time

## Next Steps

I can update `seed_users.py` to actually create users using the Admin API if you provide the service_role key, or I can create a simpler script that uses Supabase's REST API directly.

