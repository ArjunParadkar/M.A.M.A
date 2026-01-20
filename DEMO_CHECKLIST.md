# 🚀 Demo Checklist - Tonight's Mission

**Goal:** Make AI features work and basic data flow functional for demo

---

## 🎯 PRIORITY 1: AI Features (The Showcase)

### 1. STL File Storage Setup ⭐
- [ ] Create Supabase Storage bucket: `stl-files`
- [ ] Set up RLS policies for `stl-files` bucket
- [ ] Test upload/download in Supabase dashboard
- [ ] Update `apps/web/app/client/new-order/page.tsx`:
  - [ ] Actually upload STL to Supabase Storage (not just simulate)
  - [ ] Save file path to database or sessionStorage
  - [ ] Get file URL for later retrieval
- [ ] Verify file appears in storage bucket

### 2. QC Photo Storage Setup
- [ ] Create Supabase Storage bucket: `qc-photos`
- [ ] Set up RLS policies for `qc-photos` bucket
- [ ] Update `apps/web/app/maker/jobs/qc/[jobId]/page.tsx`:
  - [ ] Upload each photo to `qc-photos/{jobId}/photo-{1-4}.jpg`
  - [ ] Save photo URLs to database (in `qc_records` table)
  - [ ] Get file URLs for F3 model

### 3. F3 Quality Check API Route (CRITICAL) 🔥
- [ ] Create `apps/web/app/api/ai/qc/route.ts`
- [ ] Install Python dependencies (or use API approach):
  - Option A: Call Python script via subprocess
  - Option B: Set up FastAPI server (better for demo)
  - Option C: Use mock with realistic results (quickest for demo)
- [ ] Accept: STL file path, 4 photo URLs, job ID
- [ ] Download STL and photos
- [ ] Call F3 model (`models/f3_vision_quality_check.py`)
  - [ ] Load STL model
  - [ ] Process photos with CLIP or mock comparison
  - [ ] Calculate similarity score
  - [ ] Detect anomalies
  - [ ] Return QC results
- [ ] Return JSON: `{ qc_score, status, similarity, anomaly_score, notes }`

### 4. Connect F3 to QC Page
- [ ] Update `apps/web/app/maker/jobs/qc/[jobId]/page.tsx`:
  - [ ] After uploading 4 photos, call `/api/ai/qc`
  - [ ] Show real results (not mock)
  - [ ] Display AI comparison score
  - [ ] Show similarity to STL model
  - [ ] Display pass/review/fail status

### 5. STL File Retrieval for QC Page
- [ ] Update QC page to fetch STL file for job
- [ ] Load STL in STLViewer component
- [ ] Show STL model alongside photo uploads
- [ ] Verify STL loads correctly

---

## 🗄️ PRIORITY 2: Database Integration

### 6. Order Submission → Database
- [ ] Create `apps/web/app/api/jobs/create/route.ts`
- [ ] Accept: order form data, STL file path, client ID
- [ ] Insert into `jobs` table:
  - [ ] product_name, description, quantity
  - [ ] material, tolerance, manufacturing_types
  - [ ] deadline, suggested_pay, estimated_hours
  - [ ] stl_file_path (from storage)
  - [ ] status = 'posted'
- [ ] Update `apps/web/app/client/new-order/processing/page.tsx`:
  - [ ] On "Submit Order", call `/api/jobs/create`
  - [ ] Save job to database
  - [ ] Show success message
  - [ ] Redirect to dashboard

### 7. Fetch Real Manufacturers (F1 Matching)
- [ ] Create `apps/web/app/api/manufacturers/match/route.ts`
- [ ] Accept: job_id or job specs
- [ ] Query `manufacturers` table:
  - [ ] Filter by materials compatibility
  - [ ] Filter by equipment match
  - [ ] Filter by tolerance_tier
- [ ] Apply F1 ranking algorithm:
  - [ ] Calculate rank_score for each manufacturer
  - [ ] Sort by score
  - [ ] Return top 3-5 matches
- [ ] Include: manufacturer_id, name, rank_score, capacity_score, quality_score

### 8. F1 Ranking API Integration
- [ ] Update `apps/web/app/client/new-order/processing/page.tsx`:
  - [ ] Call `/api/manufacturers/match` instead of using mock
  - [ ] Use real manufacturer data
  - [ ] Apply completion time estimator to each match
  - [ ] Display real matches with scores

### 9. Manufacturer Accepts Job
- [ ] Create `apps/web/app/api/jobs/accept/route.ts`
- [ ] Accept: job_id, manufacturer_id
- [ ] Create entry in `active_jobs` table:
  - [ ] job_id, manufacturer_id
  - [ ] status = 'assigned'
  - [ ] started_at = NOW()
  - [ ] completed = 0
- [ ] Update `jobs` table: status = 'assigned'
- [ ] Update `apps/web/app/maker/jobs/[jobId]/page.tsx`:
  - [ ] On "Accept Job", call `/api/jobs/accept`
  - [ ] Redirect to active jobs page
  - [ ] Show success message

### 10. Fetch Active Jobs (Real Data)
- [ ] Update `apps/web/app/maker/jobs/active/page.tsx`:
  - [ ] Query `active_jobs` table for current manufacturer
  - [ ] Join with `jobs` table for job details
  - [ ] Join with `profiles` for client name
  - [ ] Replace mock data with real queries
  - [ ] Display real active jobs

### 11. Progress Updates
- [ ] Create `apps/web/app/api/jobs/update-progress/route.ts`
- [ ] Accept: active_job_id, completed_quantity
- [ ] Update `active_jobs.completed` in database
- [ ] Update `active_jobs.status` to 'in_production' if started
- [ ] Update `apps/web/app/maker/jobs/active/[jobId]/page.tsx`:
  - [ ] On progress update, call API
  - [ ] Refresh data after update
  - [ ] Show updated progress

### 12. QC Submission Save Results
- [ ] Update QC page to save results to `qc_records` table:
  - [ ] job_id, manufacturer_id
  - [ ] qc_score, qc_status, similarity_score
  - [ ] photo_urls (array)
  - [ ] submitted_at = NOW()
- [ ] Update `active_jobs` status to 'qc_pending'
- [ ] Save results to database after F3 analysis

---

## 🔗 PRIORITY 3: Data Flow & Display

### 13. Dashboard Shows Real Data
- [ ] Update `apps/web/app/maker/dashboard/page.tsx`:
  - [ ] Fetch active jobs from `active_jobs` table
  - [ ] Fetch job recommendations from `job_recommendations` table
  - [ ] Fetch long-term commissions (if applicable)
  - [ ] Replace mock data with real queries
  - [ ] Show real ongoing services

### 14. Client Dashboard Shows Orders
- [ ] Update `apps/web/app/client/dashboard/page.tsx`:
  - [ ] Fetch client's jobs from `jobs` table
  - [ ] Filter by client_id
  - [ ] Show real ongoing services
  - [ ] Replace mock data with real queries

### 15. Job Detail Pages Fetch Real Data
- [ ] Update `apps/web/app/maker/jobs/[jobId]/page.tsx`:
  - [ ] Fetch job details from `jobs` table
  - [ ] Load STL file from storage
  - [ ] Display real job information
- [ ] Update `apps/web/app/maker/jobs/active/[jobId]/page.tsx`:
  - [ ] Fetch active_job from database
  - [ ] Fetch job details
  - [ ] Load STL file for viewing
  - [ ] Show real progress

### 16. Shipping Flow
- [ ] Update `apps/web/app/maker/jobs/ship/[jobId]/page.tsx`:
  - [ ] Save tracking number to `jobs` or new `shipping` table
  - [ ] Update `active_jobs` status to 'shipped'
  - [ ] Update `jobs` status to 'shipped'
  - [ ] Save carrier and tracking info

---

## 🎨 PRIORITY 4: Polish & Demo Prep

### 17. Error Handling
- [ ] Add try/catch to all API routes
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging
- [ ] Handle missing files gracefully

### 18. Loading States
- [ ] Add loading spinners to all async operations
- [ ] Show "Processing..." during F3 analysis
- [ ] Show "Uploading..." during file uploads
- [ ] Disable buttons during operations

### 19. Success Messages
- [ ] Show success toast/alert after:
  - [ ] Order submitted
  - [ ] Job accepted
  - [ ] Progress updated
  - [ ] QC submitted
  - [ ] Shipping confirmed

### 20. Test Full Demo Flow
- [ ] **Client Side:**
  - [ ] Sign up as client
  - [ ] Create new order → Upload STL → Fill form
  - [ ] Processing page shows price + manufacturers
  - [ ] Submit order → Saves to database
  - [ ] See order in dashboard
  
- [ ] **Manufacturer Side:**
  - [ ] Sign up as manufacturer
  - [ ] See job recommendations
  - [ ] View job details → Accept job
  - [ ] See active job in dashboard
  - [ ] Update progress → Saves to database
  - [ ] Submit for QC → Upload 4 photos → Get AI score
  - [ ] See QC results → Submit for review
  - [ ] Mark as shipped → Save tracking

### 21. Seed Demo Data (Optional but Helpful)
- [ ] Run `supabase/seed_users.py` to create 10-20 demo manufacturers
- [ ] Create 5-10 demo jobs in database
- [ ] Create a few demo active_jobs
- [ ] This makes demo more impressive with real data

---

## 🚨 QUICK WINS (If Time Allows)

### 22. F4 Workflow Scheduling Display
- [ ] Create `apps/web/app/api/ai/workflow/route.ts`
- [ ] Fetch manufacturer's active jobs
- [ ] Call F4 model
- [ ] Return optimized schedule
- [ ] Display on "Current Workflow" page

### 23. Better Mock Data (If Real Data Not Ready)
- [ ] Make mock manufacturers more realistic
- [ ] Use realistic job data
- [ ] Show diverse scenarios

---

## ✅ FINAL DEMO CHECKLIST

Before demoing, verify:
- [ ] Client can create order and see price estimate
- [ ] Real manufacturers appear in recommendations
- [ ] Manufacturer can accept job
- [ ] Active job appears in dashboard
- [ ] Progress updates save and show
- [ ] QC submission uploads photos
- [ ] **F3 Quality Check shows real AI score** ⭐
- [ ] QC results display correctly
- [ ] Shipping flow works end-to-end
- [ ] All pages load without errors
- [ ] STL files display correctly
- [ ] Navigation works smoothly

---

## 📝 NOTES

**Focus Tonight:**
1. Get F3 Quality Check working (the "wow" feature)
2. Make order submission save to database
3. Make job acceptance create active_job
4. Connect real manufacturer matching

**Skip for Demo:**
- Payment processing (UI is fine)
- Email notifications
- Real-time updates (refresh works)
- Mobile optimization

**Quick Path to Working Demo:**
1. Set up Supabase Storage buckets (10 min)
2. Create API routes for jobs/create, jobs/accept, ai/qc (1-2 hours)
3. Update frontend to call APIs (1 hour)
4. Test full flow (30 min)

**Total Estimated Time:** 3-4 hours for core functionality

Let's do this! 💪

