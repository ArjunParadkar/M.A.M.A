# How to Create 100 Manufacturers and 100 Clients

## Quick Start

1. **Get your service_role key:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to **Settings** → **API**
   - Copy the **service_role** key (⚠️ Keep this secret - it has admin access!)

2. **Set environment variables:**
   ```bash
   export SUPABASE_URL="https://aywrgbfuoldtoeecsbvu.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

3. **Install Python dependencies:**
   ```bash
   pip install supabase
   ```

4. **Run the script:**
   ```bash
   cd /home/god/Desktop/M.A.M.A
   python supabase/seed_users.py
   ```

## What it does

- Creates 100 manufacturer accounts with:
  - Varied capacity scores (0.3 to 1.0)
  - Varied quality scores (0.4 to 1.0)
  - 2-5 devices each (randomly selected)
  - Different materials, tolerance tiers, locations
  - Mix of individual, small business, and corporation types

- Creates 100 client accounts with:
  - Mix of individual, small business, and corporation types
  - Auto-confirmed emails (no email verification needed)

## Credentials

- **All passwords:** `Password123!`
- **Emails:** 
  - Manufacturers: `mfg001@mama-test.com` through `mfg100@mama-test.com`
  - Clients: `client001@mama-test.com` through `client100@mama-test.com`

## Output

The script saves all credentials to `supabase/seed_users_output.json` for your records.

## Notes

- The script uses rate limiting to avoid overwhelming the API
- If there are errors, they'll be shown in the summary
- Profiles and manufacturer entries are created automatically
- Devices are randomly assigned to manufacturers

