# 🚀 Complete Setup Guide - Get Everything Running

Follow these steps in order to get your demo fully working with example users, workflows, and all AI models.

---

## Step 1: Run Database Migrations (5 minutes)

**What this does:** Creates all the database tables needed (profiles, jobs, manufacturers, etc.)

### Steps:

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/aywrgbfuoldtoeecsbvu
   - Login if needed

2. **Open SQL Editor:**
   - Click **"SQL Editor"** in the left sidebar (it looks like a `</>` icon)
   - Click the green **"New query"** button (top right)

3. **Copy the Migration SQL:**
   - Open file: `supabase/RUN_THIS_IN_SUPABASE.sql` on your computer
   - Select **ALL** the text (Ctrl+A / Cmd+A)
   - Copy it (Ctrl+C / Cmd+C)
   - It should be about 465 lines

4. **Paste into Supabase:**
   - Click in the SQL Editor text area
   - Paste the SQL (Ctrl+V / Cmd+V)

5. **Run the SQL:**
   - Click the green **"Run"** button (bottom right)
   - OR press **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac)
   - Wait 10-15 seconds for it to complete

6. **Check for Success:**
   - You should see messages like "Success. No rows returned"
   - If you see errors, let me know

**✅ Done when:** You see success messages and no errors

---

## Step 2: Set Up Storage Buckets (2 minutes)

**What this does:** Enables file uploads (STL files, QC photos)

### Steps:

1. **Go to Storage:**
   - In Supabase Dashboard, click **"Storage"** in the left sidebar
   - Click **"Create a new bucket"**

2. **Create First Bucket (`stl-files`):**
   - **Bucket name:** `stl-files`
   - **Public bucket:** ✅ CHECK this box
   - Click **"Create bucket"**

3. **Create Second Bucket (`qc-photos`):**
   - Click **"Create a new bucket"** again
   - **Bucket name:** `qc-photos`
   - **Public bucket:** ✅ CHECK this box
   - Click **"Create bucket"**

4. **Set Bucket Policies:**
   - Click on **`stl-files`** bucket
   - Click **"Policies"** tab
   - Click **"New Policy"** → **"Create policy from scratch"**
   - **Policy name:** `Allow authenticated uploads`
   - **Allowed operation:** SELECT, INSERT, UPDATE
   - **Policy definition:** Copy/paste this:
     ```sql
     (bucket_id = 'stl-files'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** → **"Save policy"**

   - **Repeat for `qc-photos` bucket** with the same policy (just change bucket name to `qc-photos`)

**✅ Done when:** Both buckets exist and have policies

---

## Step 3: Verify Environment Variables (Already Done ✅)

The `.env.local` file is already created with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`: Set ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Set ✅

**If dev server isn't running, start it:**
```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd/apps/web
npm run dev -- --port 3000
```

**✅ Done when:** Server is running at `http://localhost:3000`

---

## Step 4: Start FastAPI Server (AI Models) (1 minute)

**What this does:** Runs the AI models backend (pricing, ranking, QC, workflow)

### Steps:

1. **Open a new terminal window**

2. **Navigate to API directory:**
   ```bash
   cd /home/god/.cursor/worktrees/M.A.M.A/gdd/api
   ```

3. **Activate virtual environment and start server:**
   ```bash
   source venv/bin/activate
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **Verify it's running:**
   - You should see: `Uvicorn running on http://0.0.0.0:8000`
   - Visit: http://localhost:8000 - should show `{"message": "M.A.M.A AI Models API"}`

**✅ Done when:** FastAPI is running on port 8000

---

## Step 5: Create Example Users & Jobs (5 minutes)

**What this does:** Creates 20 manufacturers, 10 clients, and sample jobs with workflows

### Steps:

1. **Make sure you ran the SQL migrations first** (Step 1)

2. **Open a new terminal window** (keep FastAPI running in the other one)

3. **Run the demo data script:**
   ```bash
   cd /home/god/.cursor/worktrees/M.A.M.A/gdd
   
   export SUPABASE_URL="https://aywrgbfuoldtoeecsbvu.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5d3JnYmZ1b2xkdG9lZWNzYnZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY3ODk5MiwiZXhwIjoyMDg0MjU0OTkyfQ.reajF9Qp0ZJaIcwMEHd2Xm8PQczLvAIE50XJpxRrI9M"
   
   python3 supabase/create_jobs_and_workflows.py
   ```

4. **Wait for it to complete:**
   - It will create users, jobs, and assignments
   - Should take 1-2 minutes

5. **Check the output:**
   - Look for "✅ COMPLETE!" message
   - Check file: `supabase/jobs_workflows_output.json` for details

**✅ Done when:** Script completes with success messages

---

## Step 6: Test Everything (10 minutes)

### Test 1: Create Your Own Account

1. **Go to:** http://localhost:3000/auth/sign-up
2. **Choose:** Manufacturer or Client
3. **Sign up with email/password:**
   - Use your real email (or any email you want)
   - Password: whatever you want (min 6 characters)
4. **Complete profile:**
   - Fill in all the fields
   - For manufacturers: add devices, materials, location
   - For clients: add company info, address
5. **Verify:** You should see your dashboard

**✅ Working when:** You can create account and complete profile

---

### Test 2: Sign In with Mock User

**Test credentials (after running Step 5):**
- **Manufacturer:** `mfg001@mama-test.com` / `Password123!`
- **Client:** `client001@mama-test.com` / `Password123!`

1. **Go to:** http://localhost:3000/auth/sign-in
2. **Enter credentials** from above
3. **Click Sign In**
4. **Verify:** You should see the dashboard

**✅ Working when:** You can sign in with mock users

---

### Test 3: Client Creates New Order

1. **Sign in as a client** (use mock client or your own)
2. **Go to:** http://localhost:3000/client/dashboard
3. **Click "New Order"** button
4. **Choose order type** (hover for explanations)
5. **Upload STL file** (or use any .stl file)
6. **Fill in specifications:**
   - Tolerance (in thou)
   - Material
   - Manufacturing type
   - Finish details
   - Coatings (try "Paint" to see color picker)
7. **Click "Continue to AI Analysis"**
8. **Wait for AI analysis:**
   - Should show estimated price
   - Should show manufacturer matches
   - Should show completion time
9. **Click "Submit Order"**

**✅ Working when:** Order is created and you see it in your dashboard

---

### Test 4: Manufacturer Views Jobs & Workflow

1. **Sign in as manufacturer** (use mock maker or your own)
2. **Go to:** http://localhost:3000/maker/dashboard
3. **Check "Recommendations" section:**
   - Should show job recommendations
   - Click "See more" on any job
4. **Go to:** http://localhost:3000/maker/jobs
   - Should show available jobs
   - Click on a job to view details
5. **Go to:** http://localhost:3000/maker/workflow
   - Should show AI-generated workflow schedule
   - Should show device utilization
   - Should show scheduled tasks

**✅ Working when:** You see jobs and workflows generated by AI

---

### Test 5: Quality Check Flow

1. **Sign in as manufacturer**
2. **Go to an active job:**
   - http://localhost:3000/maker/jobs/active
   - Click on any job
3. **Click "Check Quality"** or go to QC page
4. **Upload 4-6 photos:**
   - Should show STL model preview
   - Upload photos from different angles
5. **Click "Compare to STL Model & Check Quality"**
6. **Wait for AI analysis:**
   - Should show QC score
   - Should show similarity, dimensional accuracy, surface quality
   - Should show anomaly score
   - Should show status (pass/review/fail)
7. **If QC passes, click "Submit for Client Review"**
8. **Go to shipping page:**
   - Enter carrier and tracking number
   - Click "Mark as Shipped"

**✅ Working when:** QC completes and shows real scores

---

### Test 6: Client Views Workflow

1. **Sign in as client**
2. **Go to:** http://localhost:3000/client/dashboard
3. **Click on an ongoing service**
4. **View workflow page:**
   - Should show job progress
   - For multi-manufacturer jobs: shows who's making what
   - Shows delivery dates
   - Shows quantities assigned

**✅ Working when:** You can see job workflow and assignments

---

## Step 7: Verify AI Models Are Running

### Test Each AI Model:

1. **F1 - Maker Ranking:**
   - Create a new order as client
   - Should see ranked manufacturers in AI analysis

2. **F2 - Pay Estimator:**
   - Create a new order as client
   - Should see price estimate with breakdown

3. **F3 - Quality Check:**
   - Submit QC photos as manufacturer
   - Should see quality scores and analysis

4. **F4 - Workflow Scheduling:**
   - Go to `/maker/workflow` as manufacturer
   - Should see optimized schedule generated by AI

**✅ Working when:** All AI features return real results (not just mock data)

---

## 📋 Quick Checklist

Before testing, make sure:
- [ ] SQL migrations run successfully (Step 1)
- [ ] Storage buckets created (Step 2)
- [ ] `.env.local` file exists (Step 3) ✅ Already done
- [ ] Next.js dev server running (port 3000)
- [ ] FastAPI server running (port 8000)
- [ ] Example users/jobs created (Step 5)

---

## 🎯 What You Should Be Able To Do

After completing all steps:

1. ✅ **Create accounts** (sign-up works)
2. ✅ **Sign in** (your accounts + mock users)
3. ✅ **Complete profiles** (manufacturer or client)
4. ✅ **Create orders** as client (with AI pricing)
5. ✅ **View jobs** as manufacturer (AI-ranked)
6. ✅ **View workflow** (AI-generated schedule)
7. ✅ **Submit QC** (AI quality check with photos)
8. ✅ **Ship products** (with contract & payment terms)
9. ✅ **View financials** (earnings, payments)
10. ✅ **Send messages** (client ↔ manufacturer chat)

---

## 🐛 Troubleshooting

### "Could not find table 'profiles'"
→ **Solution:** Run Step 1 (SQL migrations) again

### "Supabase is not configured"
→ **Solution:** Check `.env.local` exists and restart dev server (Step 3)

### "Failed to fetch" on AI endpoints
→ **Solution:** Make sure FastAPI is running (Step 4)

### No mock users created
→ **Solution:** Make sure you ran Step 1 first, then run Step 5 again

### Storage upload fails
→ **Solution:** Check Step 2 (storage buckets and policies)

---

## 📞 Next Steps After Setup

Once everything is working:

1. **Create your own demo accounts** for testing
2. **Create test orders** with real STL files
3. **Test the full flow:** Order → Accept → QC → Ship
4. **Test AI features:** Verify all 4 models are working
5. **Customize:** Add your own content, branding, etc.

---

**Need help with any step? Just ask!** 🚀

