# 🚀 Quick Start Guide - Section 1 Setup

## What I've Already Done ✅

All code is ready! Just need you to:

1. ✅ FastAPI server structure created
2. ✅ F2 Pay Estimator route implemented
3. ✅ Storage helper functions created
4. ✅ Placeholder routes for other AI models

---

## Your Tasks (15 minutes):

### Task 1: Create Supabase Storage Buckets (5 min)

1. Go to: https://supabase.com/dashboard/project/aywrgbfuoldtoeecsbvu/storage
2. Click **"New bucket"**
3. Name: `stl-files` → ✅ Public → Create
4. Click **"New bucket"** again
5. Name: `qc-photos` → ✅ Public → Create

**Done! ✅**

### Task 2: Set RLS Policies (5 min)

For each bucket (`stl-files` and `qc-photos`):

1. Click on bucket → **"Policies"** tab
2. Click **"New policy"** → **"For full customization"**

**Policy 1: Allow authenticated uploads**
- Name: `Allow authenticated uploads`
- Operation: `INSERT`
- SQL:
```sql
(
  (bucket_id = 'stl-files'::text) AND
  (auth.role() = 'authenticated'::text)
)
```
(Change `stl-files` to `qc-photos` for the other bucket)

**Policy 2: Allow authenticated reads**
- Name: `Allow authenticated reads`
- Operation: `SELECT`
- SQL:
```sql
(
  (bucket_id = 'stl-files'::text) AND
  (auth.role() = 'authenticated'::text)
)
```

**Policy 3: Allow public reads**
- Name: `Allow public reads`
- Operation: `SELECT`
- SQL:
```sql
(bucket_id = 'stl-files'::text)
```

Repeat for `qc-photos` bucket.

**Done! ✅**

### Task 3: Install Python & Start FastAPI Server (5 min)

**In terminal:**

```bash
cd /home/god/Desktop/M.A.M.A/api
pip install -r requirements.txt
python main.py
```

**Should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Test:**
- Open: http://localhost:8000
- Should see: `{"message": "M.A.M.A AI Models API"}`

**Done! ✅**

---

## ✅ Verification

- [ ] Both buckets created in Supabase Storage
- [ ] RLS policies set for both buckets
- [ ] FastAPI server running on port 8000
- [ ] Can access http://localhost:8000

**When done, tell me and we'll continue to Section 2!** 🚀

