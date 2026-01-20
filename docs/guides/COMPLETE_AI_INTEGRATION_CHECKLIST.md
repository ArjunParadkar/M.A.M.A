# 🚀 Complete AI Integration Checklist - Full Demo

**Goal:** All AI features fully integrated and working

---

## 🎯 PRIORITY 1: Core Infrastructure & Storage

### 1. Supabase Storage Setup ⭐
- [ ] Create `stl-files` bucket in Supabase Storage
- [ ] Create `qc-photos` bucket in Supabase Storage
- [ ] Set RLS policies for `stl-files` bucket (authenticated users can upload/read)
- [ ] Set RLS policies for `qc-photos` bucket (authenticated users can upload/read)
- [ ] Test upload/download in Supabase dashboard
- [ ] Verify files are accessible via public URLs

### 2. Python API Server Setup (For AI Models)
- [ ] Create `api/` directory in project root
- [ ] Set up FastAPI server (`api/main.py`)
- [ ] Install dependencies: `fastapi`, `uvicorn`, `python-multipart`
- [ ] Install AI model dependencies: `scikit-learn`, `numpy`, `pandas`
- [ ] Install F3 dependencies: `torch`, `transformers`, `pillow` (for CLIP)
- [ ] Create API routes structure:
  - [ ] `/api/ai/pay` - F2 Pay Estimator
  - [ ] `/api/ai/rank` - F1 Maker Ranking
  - [ ] `/api/ai/qc` - F3 Quality Check
  - [ ] `/api/ai/workflow` - F4 Workflow Scheduling
  - [ ] `/api/ai/rate` - Manufacturer Rating Aggregator
- [ ] Test FastAPI server runs on `localhost:8000`

---

## 🤖 PRIORITY 2: AI Model Integration

### 3. F2 - Fair Pay Estimator AI (FULLY INTEGRATED) 💰
- [ ] Create `apps/web/app/api/ai/pay/route.ts` (Next.js API route)
- [ ] Accept POST request with:
  - [ ] material, quantity, tolerance, estimated_hours
  - [ ] manufacturing_types, deadline, setup_hours
- [ ] Call FastAPI endpoint: `POST http://localhost:8000/api/ai/pay`
- [ ] FastAPI endpoint (`api/routes/pay.py`):
  - [ ] Import `models/f2_fair_pay_estimator.py`
  - [ ] Create `FairPayEstimatorModel` instance
  - [ ] Build `PayEstimateInput` from request
  - [ ] Call `model.estimate(input_data)`
  - [ ] Return `PayEstimateOutput` as JSON
- [ ] Next.js route returns: `{ suggested_pay, range_low, range_high, breakdown }`
- [ ] Update `apps/web/app/client/new-order/processing/page.tsx`:
  - [ ] Replace mock calculation with call to `/api/ai/pay`
  - [ ] Pass form data to API
  - [ ] Display real AI results
- [ ] Test with various materials, quantities, tolerances
- [ ] Verify breakdown shows: materials, labor, overhead, margin

### 4. F1 - Maker Ranking/Matching AI (FULLY INTEGRATED) 🎯
- [ ] Create `apps/web/app/api/ai/rank/route.ts` (Next.js API route)
- [ ] Accept POST request with:
  - [ ] job_id OR job specifications (material, tolerance, quantity, etc.)
- [ ] Query database:
  - [ ] Fetch all manufacturers from `manufacturers` table
  - [ ] Filter by material compatibility
  - [ ] Filter by equipment match
  - [ ] Filter by tolerance_tier compatibility
- [ ] Call FastAPI endpoint: `POST http://localhost:8000/api/ai/rank`
- [ ] Pass manufacturer data + job specs to FastAPI
- [ ] FastAPI endpoint (`api/routes/rank.py`):
  - [ ] Import `models/f1_maker_ranking.py`
  - [ ] Create `MakerRankingModel` instance
  - [ ] For each manufacturer, build `RankingInput`
  - [ ] Call `model.rank(input_data)` for each manufacturer
  - [ ] Sort by rank_score (descending)
  - [ ] Return top 5-10 matches with scores and explanations
- [ ] Next.js route returns: `[{ manufacturer_id, rank_score, explanations, estimated_completion_days }]`
- [ ] Apply completion time estimator to each match:
  - [ ] Use `lib/completionTimeEstimator.ts` or call AI model
  - [ ] Calculate `estimated_completion_days` for each manufacturer
- [ ] Update `apps/web/app/client/new-order/processing/page.tsx`:
  - [ ] Call `/api/ai/rank` instead of using mock manufacturers
  - [ ] Display real manufacturer matches with AI scores
  - [ ] Show rank_score, capacity_score, quality_score
  - [ ] Display estimated completion time for each
- [ ] Test with different job specs, verify top matches make sense

### 5. F3 - Vision Quality Check AI (FULLY INTEGRATED) 🔍
- [ ] Create `apps/web/app/api/ai/qc/route.ts` (Next.js API route)
- [ ] Accept POST request with:
  - [ ] job_id
  - [ ] 4 photo URLs (from Supabase Storage)
- [ ] Fetch STL file path from `jobs` table for job_id
- [ ] Download STL file from Supabase Storage
- [ ] Call FastAPI endpoint: `POST http://localhost:8000/api/ai/qc`
- [ ] Send: STL file, 4 photo URLs, job specifications
- [ ] FastAPI endpoint (`api/routes/qc.py`):
  - [ ] Import `models/f3_vision_quality_check.py`
  - [ ] Create `VisionQualityCheckModel` instance
  - [ ] Download photos from URLs
  - [ ] Load STL file
  - [ ] Build `QCInput`:
    - [ ] stl_file_path
    - [ ] evidence_photos (list of image paths)
    - [ ] expected_tolerance (from job specs)
    - [ ] material_spec (from job specs)
  - [ ] Call `model.check_quality(input_data)`
  - [ ] Return `QCOutput`:
    - [ ] qc_score (0-1)
    - [ ] status ('pass', 'review', 'fail')
    - [ ] similarity_to_design (0-1)
    - [ ] anomaly_score (0-1)
    - [ ] dimensional_accuracy (0-1)
    - [ ] notes (list of analysis notes)
- [ ] Next.js route returns QC results as JSON
- [ ] Save results to `qc_records` table:
  - [ ] job_id, manufacturer_id
  - [ ] qc_score, qc_status, similarity_score
  - [ ] photo_urls (array)
  - [ ] submitted_at = NOW()
- [ ] Update `active_jobs` status to 'qc_pending'
- [ ] Update `apps/web/app/maker/jobs/qc/[jobId]/page.tsx`:
  - [ ] Upload 4 photos to Supabase Storage
  - [ ] Get photo URLs
  - [ ] Call `/api/ai/qc` with photo URLs
  - [ ] Display real AI results:
    - [ ] QC Score (percentage)
    - [ ] Similarity to STL Model (percentage)
    - [ ] Dimensional Accuracy (percentage)
    - [ ] Anomaly Detection Score
    - [ ] Status (Pass/Review/Fail)
    - [ ] AI Analysis Notes
  - [ ] Show STL model alongside photos for comparison
- [ ] Test with real STL file and photos
- [ ] Verify AI comparison actually works (not mocked)

### 6. F4 - Workflow Scheduling AI (FULLY INTEGRATED) 📅
- [ ] Create `apps/web/app/api/ai/workflow/route.ts` (Next.js API route)
- [ ] Accept GET request with:
  - [ ] manufacturer_id (from authenticated session)
- [ ] Fetch manufacturer's data:
  - [ ] Active jobs from `active_jobs` table
  - [ ] Devices from `manufacturer_devices` table
  - [ ] Device availability/status
- [ ] Build workflow input:
  - [ ] Tasks (from active_jobs): job_id, estimated_hours, deadline, priority
  - [ ] Devices: device_id, device_type, available_hours_per_day
  - [ ] Current date/time
- [ ] Call FastAPI endpoint: `POST http://localhost:8000/api/ai/workflow`
- [ ] FastAPI endpoint (`api/routes/workflow.py`):
  - [ ] Import `models/f4_workflow_scheduling.py`
  - [ ] Create `WorkflowSchedulerModel` instance
  - [ ] Build `SchedulingInput` from request
  - [ ] Call `model.optimize_schedule(input_data)`
  - [ ] Return `SchedulingOutput`:
    - [ ] optimized_schedule (task assignments)
    - [ ] estimated_profit
    - [ ] device_utilization (percentage)
    - [ ] deadline_compliance (percentage)
    - [ ] metrics
- [ ] Next.js route returns optimized schedule
- [ ] Update `apps/web/app/maker/dashboard/page.tsx` (Current Workflow tab):
  - [ ] Call `/api/ai/workflow` on page load
  - [ ] Display optimized schedule:
    - [ ] Weekly calendar view
    - [ ] Device assignments
    - [ ] Job schedule with deadlines
    - [ ] Profit estimate
    - [ ] Device utilization stats
  - [ ] Show visual timeline/gantt chart
- [ ] Update `apps/web/app/maker/jobs/active/page.tsx`:
  - [ ] Optionally show recommended schedule order
- [ ] Test with multiple active jobs and devices
- [ ] Verify optimization actually improves profit/utilization

### 7. Manufacturer Rating Aggregator AI (FULLY INTEGRATED) ⭐
- [ ] Create `apps/web/app/api/ai/rate/route.ts` (Next.js API route)
- [ ] Accept GET request with:
  - [ ] manufacturer_id
- [ ] Fetch rating data from `ratings` table for manufacturer
- [ ] Fetch job history from `job_history` table
- [ ] Call FastAPI endpoint: `POST http://localhost:8000/api/ai/rate`
- [ ] FastAPI endpoint (`api/routes/rate.py`):
  - [ ] Import `models/business_logic.py`
  - [ ] Use `RatingAggregator` class
  - [ ] Call `aggregator.calculate_rating(ratings_data, job_history)`
  - [ ] Return:
    - [ ] average_rating (Bayesian adjusted)
    - [ ] total_ratings_count
    - [ ] rating_distribution
    - [ ] trend (improving/declining/stable)
- [ ] Update `manufacturers` table:
  - [ ] Update `average_rating` field
  - [ ] Update `total_ratings_received` field
- [ ] Update `apps/web/app/maker/jobs/[jobId]/page.tsx`:
  - [ ] Display manufacturer rating (from AI calculation)
  - [ ] Show rating trend if available
- [ ] Update manufacturer matching to use real-time ratings
- [ ] Test with various rating scenarios

### 8. Completion Time Estimator (ML-Ready) ⏱️
- [ ] Enhance `lib/completionTimeEstimator.ts` or create API endpoint
- [ ] Option A: Keep frontend calculator (quick)
- [ ] Option B: Create `/api/ai/completion-time` endpoint
- [ ] If API: Train model with historical data when available
- [ ] Use in F1 ranking to show completion estimates
- [ ] Update manufacturer matches to show accurate time estimates

---

## 🔗 PRIORITY 3: Database Integration & Data Flow

### 9. Order Submission → Database → AI Matching
- [ ] Update `apps/web/app/client/new-order/page.tsx`:
  - [ ] Upload STL file to Supabase Storage
  - [ ] Get STL file path/URL
- [ ] Create `apps/web/app/api/jobs/create/route.ts`
- [ ] Accept POST: order form data, STL file path, client_id
- [ ] Calculate initial price estimate (call F2 via API)
- [ ] Insert into `jobs` table:
  - [ ] All form fields (product_name, description, quantity, etc.)
  - [ ] material, tolerance, manufacturing_types, finish, coatings
  - [ ] stl_file_path
  - [ ] suggested_pay (from F2), estimated_hours (from time calculator)
  - [ ] deadline, client_id
  - [ ] status = 'posted'
- [ ] Automatically call F1 ranking API:
  - [ ] Get top manufacturer matches
  - [ ] Create entries in `job_recommendations` table:
    - [ ] job_id, manufacturer_id, rank_score
    - [ ] estimated_completion_days
    - [ ] recommended = true
- [ ] Return job_id and manufacturer matches
- [ ] Update `apps/web/app/client/new-order/processing/page.tsx`:
  - [ ] On "Submit Order", call `/api/jobs/create`
  - [ ] Show job created message
  - [ ] Display manufacturer matches (real data from F1)
  - [ ] Redirect to dashboard after submission

### 10. Manufacturer Accepts Job
- [ ] Create `apps/web/app/api/jobs/accept/route.ts`
- [ ] Accept POST: job_id, manufacturer_id
- [ ] Verify job is still available (status = 'posted' or 'assigned')
- [ ] Create entry in `active_jobs` table:
  - [ ] job_id, manufacturer_id
  - [ ] status = 'assigned'
  - [ ] started_at = NOW()
  - [ ] completed = 0
  - [ ] pay_amount (from jobs table)
- [ ] Update `jobs` table: status = 'assigned'
- [ ] Remove from `job_recommendations` (or mark as accepted)
- [ ] Update `apps/web/app/maker/jobs/[jobId]/page.tsx`:
  - [ ] Call `/api/jobs/accept` on "Accept Job"
  - [ ] Show success message
  - [ ] Redirect to active jobs page

### 11. Active Jobs Management
- [ ] Update `apps/web/app/maker/jobs/active/page.tsx`:
  - [ ] Fetch real active_jobs from database
  - [ ] Join with jobs table for details
  - [ ] Join with profiles for client name
  - [ ] Display real jobs with real data
- [ ] Create `apps/web/app/api/jobs/update-progress/route.ts`
- [ ] Accept POST: active_job_id, completed_quantity
- [ ] Update `active_jobs.completed` in database
- [ ] Update `active_jobs.status` = 'in_production' if > 0
- [ ] Check if completed >= quantity, enable QC submission
- [ ] Return updated job data

### 12. QC Submission Flow (Full Integration)
- [ ] Update `apps/web/app/maker/jobs/qc/[jobId]/page.tsx`:
  - [ ] Load STL file for job (from database)
  - [ ] Upload 4 photos to Supabase Storage
  - [ ] Get photo URLs
  - [ ] Call `/api/ai/qc` with photo URLs
  - [ ] Display F3 AI results
  - [ ] On "Submit for Review", save to `qc_records` table
  - [ ] Update `active_jobs` status = 'qc_pending'
  - [ ] Update `jobs` status = 'qc_pending'

### 13. QC Approval → Shipping Flow
- [ ] Create `apps/web/app/api/jobs/qc/approve/route.ts` (for client)
- [ ] Accept POST: qc_record_id, approved (boolean)
- [ ] Update `qc_records.approved` = true/false
- [ ] If approved:
  - [ ] Update `active_jobs` status = 'qc_approved'
  - [ ] Update `jobs` status = 'qc_approved'
  - [ ] Enable shipping
- [ ] If rejected:
  - [ ] Update `active_jobs` status = 'in_production' (resubmit)
  - [ ] Notify manufacturer

### 14. Shipping → Payment Flow
- [ ] Update `apps/web/app/maker/jobs/ship/[jobId]/page.tsx`:
  - [ ] Accept: tracking_number, shipping_carrier
  - [ ] Create entry in shipping table (or add to jobs):
    - [ ] job_id, tracking_number, carrier
    - [ ] shipped_at = NOW()
  - [ ] Update `active_jobs` status = 'shipped'
  - [ ] Update `jobs` status = 'shipped'

### 15. Payment Tracking (Optional) 💳
- [ ] Create `payments` table (if not exists):
  - [ ] id, job_id, manufacturer_id
  - [ ] amount, status ('pending', 'processing', 'completed', 'failed')
  - [ ] payment_method_id, transaction_id
  - [ ] created_at, completed_at
- [ ] Create `apps/web/app/api/payments/create/route.ts`
- [ ] When job status = 'shipped':
  - [ ] Create payment entry (status = 'pending')
  - [ ] Wait for client confirmation
- [ ] Create `apps/web/app/api/payments/confirm-receipt/route.ts` (client side)
- [ ] When client confirms receipt:
  - [ ] Update payment status = 'processing'
  - [ ] Integrate with Stripe/PayPal (if implementing)
  - [ ] Update payment status = 'completed' when processed
  - [ ] Update manufacturer earnings
- [ ] Display payment status in:
  - [ ] Client dashboard (payment made)
  - [ ] Manufacturer dashboard (payment received)
- [ ] Update `manufacturers.total_earnings` field
- [ ] Show payment history in manufacturer financials

---

## 📊 PRIORITY 4: Dashboard Integration

### 16. Manufacturer Dashboard - Real Data
- [ ] Update `apps/web/app/maker/dashboard/page.tsx`:
  - [ ] Fetch real active_jobs from database (ongoing services)
  - [ ] Fetch real job_recommendations (recommendations section)
  - [ ] Fetch long-term commissions (if any)
  - [ ] Calculate stats from real data:
    - [ ] Devices running count (from active_jobs)
    - [ ] Parts manufactured (sum of completed quantities)
    - [ ] Dollars made (sum of pay_amount from completed jobs)
  - [ ] Replace all mock data with real queries

### 17. Client Dashboard - Real Data
- [ ] Update `apps/web/app/client/dashboard/page.tsx`:
  - [ ] Fetch client's jobs from `jobs` table
  - [ ] Filter by client_id (from auth session)
  - [ ] Show real ongoing services
  - [ ] Display job status, progress (from active_jobs if exists)

### 18. Job Detail Pages - Real Data
- [ ] Update `apps/web/app/maker/jobs/[jobId]/page.tsx`:
  - [ ] Fetch job from `jobs` table
  - [ ] Fetch manufacturer match info from `job_recommendations`
  - [ ] Load STL file from storage
  - [ ] Display all real job data
- [ ] Update `apps/web/app/maker/jobs/active/[jobId]/page.tsx`:
  - [ ] Fetch active_job + job details
  - [ ] Load STL file for viewing
  - [ ] Show real progress
  - [ ] Display pay amount, deadline, etc.

### 19. Workflow Display Integration
- [ ] Update "Current Workflow" tab in dashboard:
  - [ ] Call `/api/ai/workflow` to get optimized schedule
  - [ ] Display visual timeline
  - [ ] Show device assignments
  - [ ] Display profit estimates
  - [ ] Show device utilization metrics

---

## 🔧 PRIORITY 5: Polish & Error Handling

### 20. Error Handling
- [ ] Add try/catch to all API routes
- [ ] Handle Supabase errors gracefully
- [ ] Handle FastAPI errors (if server down, show fallback)
- [ ] Handle file upload errors
- [ ] Handle AI model errors
- [ ] Show user-friendly error messages
- [ ] Log errors for debugging

### 21. Loading States
- [ ] Add loading spinners to all async operations:
  - [ ] Order submission
  - [ ] Job acceptance
  - [ ] F1 ranking (can take a few seconds)
  - [ ] F3 QC analysis (can take 10-30 seconds)
  - [ ] F4 workflow optimization
  - [ ] File uploads
- [ ] Disable buttons during operations
- [ ] Show progress indicators

### 22. Success Messages & Feedback
- [ ] Show success toasts/alerts after:
  - [ ] Order submitted
  - [ ] Job accepted
  - [ ] Progress updated
  - [ ] QC submitted
  - [ ] Shipping confirmed
  - [ ] Payment processed
- [ ] Show info messages:
  - [ ] "AI is analyzing..." during processing
  - [ ] "Finding best manufacturers..." during matching

### 23. Validation
- [ ] Validate STL file format before upload
- [ ] Validate photo formats (jpg, png)
- [ ] Validate photo count (exactly 4 for QC)
- [ ] Validate form inputs
- [ ] Validate API inputs

---

## ✅ FINAL TESTING CHECKLIST

### Full End-to-End Test Flow:
- [ ] **Client Side:**
  - [ ] Sign up → Complete profile
  - [ ] Create order → Upload STL → Fill all specs
  - [ ] Processing page:
    - [ ] F2 calculates accurate price ✅
    - [ ] F1 matches manufacturers with scores ✅
    - [ ] Completion time shown for each match ✅
  - [ ] Submit order → Saves to database ✅
  - [ ] See order in dashboard ✅
  
- [ ] **Manufacturer Side:**
  - [ ] Sign up → Add devices → Complete profile
  - [ ] See job recommendations (from F1) ✅
  - [ ] View job details → See STL model ✅
  - [ ] Accept job → Creates active_job ✅
  - [ ] See active job in dashboard ✅
  - [ ] Update progress → Saves to database ✅
  - [ ] Submit for QC:
    - [ ] Upload 4 photos ✅
    - [ ] F3 analyzes photos vs STL ✅
    - [ ] Shows similarity score ✅
    - [ ] Shows QC pass/review/fail ✅
    - [ ] Saves results to database ✅
  - [ ] Client approves QC ✅
  - [ ] Mark as shipped → Saves tracking ✅
  - [ ] Payment processed (if implementing) ✅

- [ ] **Dashboard Features:**
  - [ ] Manufacturer dashboard shows real stats ✅
  - [ ] Workflow tab shows F4 optimized schedule ✅
  - [ ] Device assignments displayed ✅
  - [ ] Profit estimates shown ✅

### AI Model Tests:
- [ ] F1 Ranking: Returns manufacturers sorted by score ✅
- [ ] F2 Pricing: Calculates accurate prices for various materials ✅
- [ ] F3 QC: Compares photos to STL, returns similarity score ✅
- [ ] F4 Workflow: Optimizes schedule for multiple jobs ✅
- [ ] Rating Aggregator: Calculates Bayesian ratings ✅

---

## 📝 NOTES

**FastAPI Server Setup:**
```python
# api/main.py structure
from fastapi import FastAPI
from routes import pay, rank, qc, workflow, rate

app = FastAPI()
app.include_router(pay.router, prefix="/api/ai/pay")
app.include_router(rank.router, prefix="/api/ai/rank")
app.include_router(qc.router, prefix="/api/ai/qc")
app.include_router(workflow.router, prefix="/api/ai/workflow")
app.include_router(rate.router, prefix="/api/ai/rate")
```

**Run FastAPI:**
```bash
cd api
uvicorn main:app --reload --port 8000
```

**Total Estimated Time:** 6-8 hours for complete AI integration

Let's build this! 💪🤖

