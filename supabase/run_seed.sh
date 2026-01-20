#!/bin/bash
# Quick script to run seed_users.py with environment variables

# Check if service role key is provided
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set"
    echo ""
    echo "To get your service role key:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to Settings → API"
    echo "4. Copy the 'service_role' key (NOT the anon key)"
    echo ""
    echo "Then run:"
    echo "  export SUPABASE_SERVICE_ROLE_KEY='your-key-here'"
    echo "  ./supabase/run_seed.sh"
    echo ""
    exit 1
fi

# Set Supabase URL (already configured)
export SUPABASE_URL="https://aywrgbfuoldtoeecsbvu.supabase.co"

echo "🚀 Starting to create 100 manufacturers and 100 clients..."
echo "📧 All emails: @mama-test.com"
echo "🔑 All passwords: Password123!"
echo ""

# Run the seed script
cd /home/god/.cursor/worktrees/M.A.M.A/gdd
python3 supabase/seed_users.py

echo ""
echo "✅ Done! Check supabase/seed_users_output.json for all credentials"


