# 🚀 How to Run Project M.A.M.A

## 📋 Quick Start (5 minutes)

### Step 1: Setup Database (One-time, ~5 minutes)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/aywrgbfuoldtoeecsbvu
   - Login if needed

2. **Run SQL Migrations:**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New query"** button
   - Open file: `supabase/RUN_THIS_IN_SUPABASE.sql`
   - Copy **ALL** contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor (Ctrl+V)
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for success messages

3. **Create Storage Buckets:**
   - Click **"Storage"** in left sidebar
   - Create bucket: `stl-files` (Public ✅)
   - Create bucket: `qc-photos` (Public ✅)
   - Set policies (see `docs/setup/SUPABASE_STORAGE_SETUP.md`)

4. **Auto-Confirm Users (Optional but Recommended):**
   - In SQL Editor, run: `supabase/AUTO_CONFIRM_USERS.sql`
   - This disables email verification

---

### Step 2: Create Demo Users (One-time, ~2 minutes)

```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
python3 supabase/create_50_manufacturers.py
```

This creates 50 verified manufacturers ready for demo.

**Test Credentials:**
- Email: `mfg001@mama-demo.com` through `mfg050@mama-demo.com`
- Password: `Password123!`

---

### Step 3: Start Frontend Server (Always running)

**Terminal 1:**
```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd/apps/web
npm run dev -- --port 3000
```

**Wait for:** `✓ Ready on http://localhost:3000`

**Access:** http://localhost:3000

---

### Step 4: Start Backend (AI Models) Server (Always running)

**Terminal 2:**
```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd/api
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Wait for:** `INFO: Uvicorn running on http://0.0.0.0:8000`

**Verify:** Visit http://localhost:8000 - should show JSON message

---

## ✅ Verify Everything is Running

1. **Frontend:** http://localhost:3000 (shows homepage)
2. **Backend:** http://localhost:8000 (shows `{"message": "M.A.M.A AI Models API"}`)
3. **Sign Up:** http://localhost:3000/auth/sign-up (should work without email verification)

---

## 🎯 Daily Usage

### To Start Development:

**Open 2 terminals:**

**Terminal 1 (Frontend):**
```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd/apps/web
npm run dev -- --port 3000
```

**Terminal 2 (Backend):**
```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd/api
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**Then:**
- Visit http://localhost:3000
- Sign up or sign in
- Create orders, test features, etc.

---

## 📁 Project Structure

```
gdd/
├── apps/web/              # Next.js frontend
│   ├── app/               # Pages & API routes
│   ├── components/        # React components
│   └── lib/               # Utilities
├── api/                   # FastAPI backend
│   ├── routes/            # API route handlers
│   └── main.py            # FastAPI server
├── models/                # AI models (Python)
│   ├── f1_maker_ranking.py
│   ├── f2_fair_pay_estimator.py
│   ├── f3_vision_quality_check.py
│   └── f4_workflow_scheduling.py
├── supabase/              # Database scripts
│   ├── RUN_THIS_IN_SUPABASE.sql  # Main migration
│   ├── create_50_manufacturers.py
│   └── migrations/        # Individual migrations
├── docs/                  # Documentation
│   ├── PROJECT_PAPER.html # Official 10-page paper (PDF)
│   ├── setup/             # Setup guides
│   ├── guides/            # How-to guides
│   └── status/            # Project status
└── packages/              # Shared TypeScript types
```

---

## 🛠️ Troubleshooting

### "Supabase is not configured"
- Check: `apps/web/.env.local` exists
- Should have:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://aywrgbfuoldtoeecsbvu.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
- Restart frontend server if you just created it

### "Could not find table 'profiles'"
- **Solution:** Run `supabase/RUN_THIS_IN_SUPABASE.sql` in Supabase SQL Editor

### "Port 3000 already in use"
- **Solution:** Kill the process or use different port:
  ```bash
  npm run dev -- --port 3001
  ```

### "Port 8000 already in use"
- **Solution:** Kill the process or use different port:
  ```bash
  python -m uvicorn main:app --host 0.0.0.0 --port 8001
  ```
  Then update `FASTAPI_URL` in `.env.local` if needed

### "Module not found" (Python)
- **Solution:**
  ```bash
  cd api
  source venv/bin/activate
  pip install -r requirements.txt
  ```

### AI endpoints not working
- **Check:** Backend server is running on port 8000
- **Check:** Visit http://localhost:8000 to verify
- **Check:** Frontend `.env.local` has correct URL

---

## 📝 Environment Variables

### Frontend (`apps/web/.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=https://aywrgbfuoldtoeecsbvu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend (for scripts):
```bash
export SUPABASE_URL="https://aywrgbfuoldtoeecsbvu.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

---

## 🔗 Important URLs

- **Homepage:** http://localhost:3000
- **Client Dashboard:** http://localhost:3000/client/dashboard
- **Maker Dashboard:** http://localhost:3000/maker/dashboard
- **Sign Up:** http://localhost:3000/auth/sign-up
- **Sign In:** http://localhost:3000/auth/sign-in
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Swagger UI)

---

## 📚 Documentation

- **Main README:** `README.md`
- **System Overview:** `docs/COMPLETE_SYSTEM_OVERVIEW.md`
- **Official Paper:** `docs/PROJECT_PAPER.html` (open → Print to PDF)
- **Setup Guides:** `docs/setup/`
- **How-to Guides:** `docs/guides/`

---

## ✅ Checklist Before Demo

- [ ] Database migrations run (`RUN_THIS_IN_SUPABASE.sql`)
- [ ] Storage buckets created (`stl-files`, `qc-photos`)
- [ ] 50 manufacturers created (`create_50_manufacturers.py`)
- [ ] Frontend server running (port 3000)
- [ ] Backend server running (port 8000)
- [ ] Can sign up and create account
- [ ] Can create order with STL upload
- [ ] AI analysis works (price, matches, time)
- [ ] Can sign in as manufacturer
- [ ] Can accept jobs
- [ ] QC submission works
- [ ] All features tested

---

**You're ready to run the project!** 🚀


