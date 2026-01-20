# Setup Demo Users

## Quick Start: Create 100 Mock Users

To create 100 manufacturers and 100 clients for your demo:

### 1. Get Your Service Role Key
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project (aywrgbfuoldtoeecsbvu)
- Go to **Settings** → **API**
- Copy the **`service_role`** key (⚠️ Keep this secret - it has admin access!)
  - It looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2. Run the Seed Script

```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd

# Set the service role key
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key-here'

# Run the seed script
./supabase/run_seed.sh
```

Or run directly:
```bash
export SUPABASE_SERVICE_ROLE_KEY='your-key-here'
python3 supabase/seed_users.py
```

### 3. What Gets Created

✅ **100 Manufacturers:**
- Emails: `mfg001@mama-test.com` through `mfg100@mama-test.com`
- Varied capacity scores, quality scores, devices (2-5 each)
- Different materials, tolerance tiers, locations (16 states)
- Mix of individual, small business, and corporation types

✅ **100 Clients:**
- Emails: `client001@mama-test.com` through `client100@mama-test.com`
- Mix of individual, small business, and corporation types

🔑 **All Passwords:** `Password123!`

### 4. Output

All credentials are saved to `supabase/seed_users_output.json` for your reference.

---

## Your Own Accounts (For Creating New Demo Accounts)

Your sign-up flow is already fully working! You can create your own accounts:

### To Create Your Own Account:

1. **Go to Sign Up:**
   - Visit: `http://localhost:3000/auth/sign-up`
   - Or click "Sign Up" on the homepage

2. **Choose Account Type:**
   - **Manufacturer** - For makers/manufacturers
   - **Client** - For companies/individuals needing parts

3. **Sign Up Options:**
   - **Email/Password** (recommended for testing):
     - Enter your email
     - Password (min 6 characters)
     - Click "Sign Up"
   - **Google OAuth** (if configured in Supabase)

4. **Complete Profile:**
   - After sign-up, you'll be redirected to `/auth/complete-profile`
   - **Manufacturers:** Fill in devices, materials, location, etc.
   - **Clients:** Fill in company/individual info, address, etc.

5. **You're Done!**
   - Your account is created and you can use it for demos

### Testing Sign-In:

- Go to: `http://localhost:3000/auth/sign-in`
- Use your email/password to log in
- Or use any of the mock user credentials from the seed script

---

## Quick Reference

### Mock User Credentials (after running seed script):
- **Manufacturer Example:** `mfg001@mama-test.com` / `Password123!`
- **Client Example:** `client001@mama-test.com` / `Password123!`

### Your Own Account:
- Use any email you want (e.g., `yourname@example.com`)
- Password of your choice (min 6 chars)
- Created via `/auth/sign-up`

---

## Troubleshooting

### Seed Script Fails:
- **"SUPABASE_SERVICE_ROLE_KEY not set"** → Make sure you exported the environment variable
- **"Module not found: supabase"** → Run `pip3 install supabase` (or use venv)
- **Rate limiting errors** → Script includes delays, but if you hit limits, wait a minute and re-run

### Sign-Up Fails:
- **"Supabase is not configured"** → Check `apps/web/.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **"Email already exists"** → That email is already taken, use a different one
- **"Unsupported provider" (Google)** → Google OAuth isn't configured yet - use email/password for now

---

## Next Steps After Creating Users

1. **Test the Demo Flow:**
   - Sign in as a client → Create a new order
   - Sign in as a manufacturer → View jobs and accept them
   - Test the QC workflow → Upload photos and check quality

2. **Create Test Jobs:**
   - Use a client account to create orders
   - Watch them appear in manufacturer dashboards

3. **Test AI Features:**
   - F1 Maker Ranking (when client creates order)
   - F2 Pay Estimator (during order creation)
   - F3 Quality Check (manufacturer QC page)
   - F4 Workflow Scheduling (manufacturer workflow page)

