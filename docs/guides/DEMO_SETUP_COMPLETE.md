# 🚀 Complete Demo Setup Guide

## ✅ What's Been Implemented

### 1. **50 Verified Manufacturers** ✅
Script: `supabase/create_50_manufacturers.py`

**Features:**
- Creates 50 manufacturers with varied:
  - Device types (3D printers, CNC, lasers, etc.)
  - Materials (20+ materials)
  - Capacity scores (0.4-1.0)
  - Quality scores (0.5-1.0)
  - Locations (20 states)
  - Business types (individual, small business, corporation)

**To Run:**
```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
python3 supabase/create_50_manufacturers.py
```

**Credentials:**
- All manufacturers use: `Password123!`
- Emails: `mfg001@mama-demo.com` through `mfg050@mama-demo.com`
- Full list saved to: `supabase/demo_manufacturers.json`

---

### 2. **Auto-Distribution Algorithm** ✅
New API: `/api/jobs/auto-distribute`

**How It Works:**
- When a client creates an **open request** with quantity ≥ 100 units:
  1. System automatically calls F1 ranking to get top manufacturers
  2. Distributes units proportionally based on:
     - Rank score (from F1)
     - Capacity score
     - Quality score
  3. Minimum 10 units per manufacturer (if possible)
  4. Maximum based on capacity (capacity_score × 500 units)
  5. Creates `job_assignments` for each manufacturer
  6. Each manufacturer gets notified via their dashboard

**Example:**
- Client creates open request: 2000 units
- System finds top 20 manufacturers
- Distributes: Manufacturer A gets 150 units, B gets 120 units, etc.
- All manufacturers see the job in their "Recommendations" section

**Manual Override:**
- Client can also manually choose specific manufacturers
- Client can adjust quantities before distribution
- System respects existing assignments

---

### 3. **Quality Check with STL Files** ✅

**How It Works:**
1. Client uploads STL file → stored in Supabase Storage (`stl-files` bucket)
2. STL URL saved to job record (`stl_url` field)
3. Manufacturer uploads 4-6 QC photos → stored in Supabase Storage (`qc-photos` bucket)
4. QC endpoint (`/api/ai/qc`) receives:
   - `stl_file_url` (from job)
   - `evidence_photo_urls` (from manufacturer uploads)
5. F3 model:
   - Downloads STL file to temp location
   - Downloads QC photos to temp location
   - Analyzes STL geometry (volume, surface area, bounding box)
   - Analyzes photos (histogram, edges, texture, color)
   - Compares STL-derived features to photo features
   - Detects anomalies using edge detection
   - Generates QC score, dimensional accuracy, surface quality

**Testing with predator.stl:**
1. Get a predator.stl file (or any STL file)
2. Upload it when creating a job as a client
3. Complete the order → STL is stored
4. As manufacturer, go to QC page for that job
5. Upload 4-6 photos of the manufactured part
6. System will compare photos to the STL file

**Note:** If you need a predator.stl file:
- Download from: https://www.thingiverse.com/thing:123456 (example)
- Or create a simple STL file using Blender/CAD software
- Save it in `apps/web/public/test-files/predator.stl` for easy upload testing

---

## 📋 Complete Demo Flow

### **Step 1: Setup Manufacturers** (5 minutes)

```bash
cd /home/god/.cursor/worktrees/M.A.M.A/gdd
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5d3JnYmZ1b2xkdG9lZWNzYnZ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY3ODk5MiwiZXhwIjoyMDg0MjU0OTkyfQ.reajF9Qp0ZJaIcwMEHd2Xm8PQczLvAIE50XJpxRrI9M"
python3 supabase/create_50_manufacturers.py
```

Expected output:
```
✅ Successfully created: 50 manufacturers
📋 Sample Manufacturers Created:
  1. Maker 1 (mfg001@mama-demo.com) - 4 devices, Quality: 0.85
  2. Maker 2 (mfg002@mama-demo.com) - 3 devices, Quality: 0.92
  ...
💾 Full list saved to: supabase/demo_manufacturers.json
```

---

### **Step 2: Create Test Client Account** (1 minute)

1. Go to: http://localhost:3000/auth/sign-up
2. Choose "Client"
3. Sign up with email/password
4. Complete profile (any info is fine)
5. You'll be redirected to client dashboard

---

### **Step 3: Create Open Request with 2000 Units** (3 minutes)

1. On client dashboard, click **"New Order"**
2. Choose **"Open Request"**
3. Upload an STL file (e.g., `predator.stl` or any STL)
4. Fill in specifications:
   - Quantity: **2000**
   - Material: Choose one (e.g., "ABS")
   - Tolerance: e.g., 0.010 (thou)
   - Manufacturing type: e.g., "3D Print"
   - Deadline: Set a future date
5. Click **"Continue to AI Analysis"**
6. Wait for AI analysis:
   - Price estimate appears
   - Manufacturer matches appear
   - Completion time estimate appears
7. Click **"Submit Order"**

**What Happens:**
- Job is created with `order_type: 'open-request'`
- F1 ranking runs → top 20 manufacturers ranked
- Auto-distribution triggers (since quantity ≥ 100)
- Job is split among 15-20 manufacturers
- Each manufacturer gets 80-200 units (based on capacity)
- All manufacturers see job in their "Recommendations" section

---

### **Step 4: Verify Distribution** (2 minutes)

1. Sign in as a manufacturer (e.g., `mfg001@mama-demo.com` / `Password123!`)
2. Go to: http://localhost:3000/maker/dashboard
3. Check **"Recommendations"** section
4. You should see the open request job
5. Click **"See more open requests"**
6. Go to: http://localhost:3000/maker/jobs
7. You should see the job listed
8. Click on the job → See assigned quantity (e.g., "150 units")
9. Click **"Accept Job"** → You're assigned those units

---

### **Step 5: Test Quality Check with STL** (5 minutes)

1. As manufacturer, go to an active job
2. Click **"Check Quality"** or go to QC page
3. You should see the STL model rotating in the preview
4. Upload 4-6 photos of a manufactured part (different angles)
5. Click **"Compare to STL Model & Check Quality"**

**What Happens:**
1. System downloads STL file from Supabase Storage
2. System downloads your QC photos from Supabase Storage
3. F3 model analyzes:
   - STL geometry (volume, dimensions, surface area)
   - Photo features (edges, texture, color histogram)
   - Compares them for similarity
   - Detects anomalies (cracks, warping, etc.)
   - Calculates dimensional accuracy
   - Calculates surface quality
4. Returns QC results:
   - **QC Score**: 0-1 (overall quality)
   - **Status**: "pass", "review", or "fail"
   - **Similarity**: How similar photos are to STL
   - **Dimensional Accuracy**: 0-1 score
   - **Surface Quality**: 0-1 score
   - **Anomaly Score**: 0-1 (higher = fewer defects)
   - **Notes**: Issues found

6. If QC passes, click **"Submit for Client Review"**
7. Then go to shipping page → Enter tracking info → Mark as shipped

---

## 🔧 Testing Checklist

Before demo, verify:

- [ ] **50 manufacturers created** (check `supabase/demo_manufacturers.json`)
- [ ] **Can sign in as manufacturer** (use `mfg001@mama-demo.com` / `Password123!`)
- [ ] **Can sign in as client** (use your test client account)
- [ ] **Client can create open request** with STL upload
- [ ] **Auto-distribution works** (check assignments in database)
- [ ] **Manufacturers see recommendations** (check maker dashboard)
- [ ] **QC works with STL files** (test with actual STL + photos)
- [ ] **STL viewer displays** correctly (rotating 3D model)
- [ ] **All AI features working**:
  - [ ] F1 Maker Ranking (manufacturer matches)
  - [ ] F2 Pay Estimator (price estimates)
  - [ ] F3 Quality Check (STL + photo comparison)
  - [ ] F4 Workflow Scheduling (optimized schedule)

---

## 🐛 Troubleshooting

### "No manufacturers found in recommendations"
→ **Solution:** Make sure you ran `create_50_manufacturers.py` first

### "Auto-distribution didn't run"
→ **Solution:** 
- Check job `order_type` is `'open-request'`
- Check job `quantity` is ≥ 100
- Check F1 ranking was run (should happen automatically)

### "QC fails to download STL"
→ **Solution:**
- Verify STL file was uploaded to Supabase Storage
- Check `jobs.stl_url` field has valid URL
- Check Storage bucket `stl-files` has proper permissions

### "QC photos don't upload"
→ **Solution:**
- Check Storage bucket `qc-photos` exists
- Verify bucket is public or has proper RLS policies
- Check file size (< 10MB recommended)

---

## 📝 Quick Reference

**Manufacturer Test Accounts:**
- Email: `mfg001@mama-demo.com` through `mfg050@mama-demo.com`
- Password: `Password123!`

**API Endpoints:**
- Create job: `POST /api/jobs`
- Auto-distribute: `POST /api/jobs/auto-distribute`
- QC check: `POST /api/ai/qc`
- F1 ranking: `POST /api/ai/rank`
- F2 pay estimate: `POST /api/ai/pay`

**Database Tables:**
- `profiles` - User profiles
- `manufacturers` - Manufacturer details
- `jobs` - Job orders
- `job_recommendations` - F1 ranking results
- `job_assignments` - Multi-manufacturer assignments
- `qc_records` - Quality check results

---

## 🎯 Demo Script

1. **Show 50 manufacturers** → Sign in as maker, show dashboard
2. **Create large open request** → Client creates 2000-unit job
3. **Show auto-distribution** → Check job assignments, show it split among 20 makers
4. **Show manufacturer view** → Sign in as maker, see recommendation
5. **Show QC with STL** → Upload photos, compare to STL, show results
6. **Show workflow** → Show AI-optimized schedule

**You're ready for the demo!** 🚀
