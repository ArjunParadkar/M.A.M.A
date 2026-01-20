# 🎯 M.A.M.A - Complete System Overview

## 📋 Table of Contents
1. [System Architecture](#system-architecture)
2. [User Roles](#user-roles)
3. [All Pages & Routes](#all-pages--routes)
4. [All AI Models](#all-ai-models)
5. [All API Endpoints](#all-api-endpoints)
6. [All Buttons & Actions](#all-buttons--actions)
7. [Database Structure](#database-structure)
8. [Complete Feature List](#complete-feature-list)

---

## 🏗️ System Architecture

**Tech Stack:**
- **Frontend:** Next.js 16.1.2 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** FastAPI (Python), Next.js API Routes (TypeScript)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (STL files, QC photos)
- **Authentication:** Supabase Auth (Email/Password, Google OAuth)
- **AI Models:** Python (NumPy, Pillow, numpy-stl) - Heuristic implementations

**Project Structure:**
```
/home/god/.cursor/worktrees/M.A.M.A/gdd/
├── apps/web/                    # Next.js frontend
│   ├── app/                     # Next.js app directory
│   │   ├── api/                 # API routes
│   │   ├── auth/                # Authentication pages
│   │   ├── client/              # Client user pages
│   │   ├── maker/               # Manufacturer user pages
│   │   └── page.tsx             # Homepage
│   ├── components/              # React components
│   └── lib/                     # Utilities
├── api/                         # FastAPI backend
│   ├── routes/                  # API route handlers
│   └── main.py                  # FastAPI server
├── models/                      # AI model implementations
│   ├── f1_maker_ranking.py
│   ├── f2_fair_pay_estimator.py
│   ├── f3_vision_quality_check.py
│   └── f4_workflow_scheduling.py
└── supabase/                    # Database scripts
    ├── RUN_THIS_IN_SUPABASE.sql
    └── migrations/
```

---

## 👥 User Roles

### 1. **Client** (Individual, Small Business, Corporation)
- **Purpose:** Post manufacturing jobs, get parts manufactured
- **Capabilities:**
  - Create new orders (Open Request, Quick Service, Closed Request, Closed Commission)
  - View ongoing services (jobs in progress)
  - Track workflow for multi-manufacturer jobs
  - Message manufacturers
  - View financials (payments, transactions)
  - View job details and history

### 2. **Manufacturer** (Individual, Small Business, Corporation)
- **Purpose:** Accept jobs, manufacture parts, earn income
- **Capabilities:**
  - View job recommendations (Open Requests, Quick Services)
  - Accept jobs (full or partial quantities for open requests)
  - View active jobs and workflow schedule
  - Submit quality check photos (4-6 photos)
  - Ship products with tracking
  - View earnings and financials
  - Manage devices (equipment inventory)
  - View long-term commissions

### 3. **Admin** (Future - not fully implemented)
- **Purpose:** Platform management
- **Capabilities:** View all profiles, moderate disputes

---

## 📄 All Pages & Routes

### **Public Pages**

#### `/` (Homepage)
- **Features:**
  - Hero section with animated images
  - Navigation bar (Home, Features, Solutions, Get Started)
  - Problem statements (rotating every 4 seconds)
  - Solutions section (expandable)
  - AI-Powered Features section (horizontally scrollable):
    - F1: Maker Ranking
    - F2: Fair Pay Estimator
    - F3: Quality Control
    - F4: Workflow Scheduling
    - Time Calculator
    - Earnings Calculator
    - Project Recommender
    - Rating System
  - **Dev Mode Buttons:** Client Dashboard, Maker Dashboard

---

### **Authentication Pages**

#### `/auth/sign-up`
- **Features:**
  - Choose account type: Manufacturer or Client
  - Two sign-up methods:
    - **Google OAuth** (redirects to Google)
    - **Email/Password** (with validation)
  - Auto-redirects to complete profile after sign-up
  - **Buttons:**
    - "Continue with Google" (OAuth)
    - "Create Account" (Email/Password form)

#### `/auth/sign-in`
- **Features:**
  - Sign in with Email/Password
  - Sign in with Google OAuth
  - Redirects to dashboard after login
  - **Buttons:**
    - "Sign In" (form submit)
    - "Continue with Google" (OAuth)
    - Link to Sign Up

#### `/auth/complete-profile`
- **Manufacturer Form (4 Steps):**
  - **Step 1:** Personal Info (Name, Business Type, Company Name, Phone, Address, City, State, ZIP)
  - **Step 2:** Location & Materials (State, ZIP, Materials array)
  - **Step 3:** Equipment (Add devices: Name, Type, Model, Status)
  - **Step 4:** Capacity & Quality (Capacity Score, Quality Score, Tolerance Tier)
  - **Buttons:**
    - "Next" (steps 1-3)
    - "Complete Profile" (step 4)
    - "Back" (steps 2-4)

- **Client Form (Single Step):**
  - Name, Client Type (Individual/Small Business/Corporation)
  - Company Name (if business/corp)
  - Phone, Address, City, State, ZIP
  - **Button:** "Complete Profile"

#### `/auth/callback`
- **Purpose:** OAuth callback handler
- Redirects to dashboard or specified redirect URL

#### `/auth/sign-out` (API Route)
- **Purpose:** Signs out user
- Redirects to homepage

---

### **Client Pages**

#### `/client/dashboard`
- **Header:**
  - "Hello, [Client Name]"
  - Profile icon with dropdown
  - Notification bell (shows new requests count)

- **Sections:**
  1. **Your Ongoing Services**
     - Grid of service cards showing:
       - Product name
       - Manufacturer name
       - Progress bar (completed/quantity)
       - Deadline
       - Status badge
     - **Buttons on each card:**
       - Click card → Go to workflow page
       - "View & Message →" link → Go to job details page

  2. **New Order Button**
     - Dropdown menu with 4 options:
       - **Open Request** (tooltip: Large tasks, manufacturers accept portions)
       - **Open Quick Service** (tooltip: Clients trust app to assign to qualified manufacturers)
       - **Closed Request** (tooltip: Single manufacturer bid)
       - **Closed Commission** (tooltip: Direct manufacturer assignment)
     - Each option navigates to `/client/new-order?type={type}`

- **Buttons:**
  - "New" (dropdown)
  - Profile icon dropdown (Profile, Sign Out)
  - Notification bell

#### `/client/new-order`
- **Features:**
  - STL file upload with 3D preview (rotating viewer)
  - Order specifications form:
    - **Product Name**
    - **Description**
    - **Quantity**
    - **Tolerance (thou)** - e.g., 0.005"
    - **Exact Material Specification** (dropdown)
    - **Manufacturing Type** (checkboxes: Pressed, CNC, Injection Molded, 3D Resin, etc.)
    - **Finish Details** (dropdown: Polished, Brushed, Sandblasted, etc.)
    - **Coatings** (checkboxes: Anodized, Powder Coat, Paint, etc.)
      - If Paint selected → Color picker appears
    - **Screw/Hardware Dimensions** (text input)
    - **Deadline** (date picker)
    - **Estimated Budget** (optional)
  - **Button:** "Continue to AI Analysis"

#### `/client/new-order/processing`
- **Features:**
  - Animated processing steps:
    1. Analyzing STL file
    2. Calculating material requirements
    3. Estimating manufacturing time
    4. Finding best manufacturers (F1 ranking)
    5. Calculating fair pay (F2 pricing)
  - **Results displayed:**
    - Price estimate (suggested pay, range)
    - Estimated completion time
    - Top 5 manufacturer matches with:
      - Rank score
      - Completion time estimate
      - Distance (if available)
    - Breakdown of costs
  - **Buttons:**
    - "Submit Order" (creates job in database)
    - "Back to Edit" (go back to form)

#### `/client/jobs/[jobId]`
- **Features:**
  - Job details (title, description, specifications)
  - STL model viewer (rotating 3D preview)
  - Manufacturer assignment info
  - Messages section (client ↔ manufacturer chat)
  - Order timeline/status
  - **Buttons:**
    - "Send Message" (opens message composer)
    - "View Workflow" (for multi-manufacturer jobs)

#### `/client/jobs/[jobId]/workflow`
- **Features:**
  - For **Open Requests** (multi-manufacturer):
    - Shows total quantity ordered
    - Shows total assigned (sum of all assignments)
    - Shows remaining unassigned quantity
    - List of all manufacturer assignments:
      - Manufacturer name
      - Assigned quantity
      - Completed quantity / Assigned quantity
      - Progress bar
      - Estimated delivery date
      - Pay amount per unit
      - Status (Accepted, In Production, QC Pending, Shipped, Delivered)
  
  - For **Single Manufacturer Jobs:**
    - Shows single manufacturer assignment
    - Progress bar
    - Timeline

- **Buttons:**
  - "View Job Details" (back to job page)
  - "Message [Manufacturer Name]"

#### `/client/financials`
- **Features:**
  - Financial transaction history
  - Payment status (Pending, Authorized, Paid, Failed, Refunded)
  - Transaction details (amount, date, job reference)
  - Filtering by status
  - **Buttons:**
    - Filter buttons (All, Pending, Paid, etc.)
    - Export button (future)

---

### **Manufacturer Pages**

#### `/maker/dashboard`
- **Header:**
  - "Hello, Maker"
  - Top navigation tabs: **Dashboard | Shop | Current Workflow | Devices**
  - Profile icon with "Profile" text
  - Notification bell (shows new requests count)

- **Sections:**

  1. **Your Stats** (fade-in animation)
     - **Devices** (count of active devices)
       - "See devices" button → `/maker/devices`
     - **Parts Manufactured** (total jobs completed)
     - **Dollars Made** (total earnings)
     - **Buttons:**
       - "View All Stats"
       - "View Financials" → `/maker/financials`

  2. **Ongoing Services** (scrollable carousel)
     - Service cards showing:
       - Rotating STL mesh preview
       - Client name
       - Deadline
       - Attempts count
       - Progress status
     - **Navigation:** Left/Right arrow buttons
     - **Click card** → `/maker/jobs/active/[jobId]`

  3. **Long-term Commissions**
     - Product cards showing:
       - Product name
       - Quota per week (e.g., "4 / 8")
       - Progress bar
     - **Click card** → `/maker/commissions/[commissionId]`

  4. **Recommendations Wheel** (horizontally scrollable)
     - Mixed cards showing:
       - **Open Requests** (type badge)
       - **Quick Services** (type badge)
     - Each card shows:
       - Job title
       - Estimated time
       - Quality rating
       - Pay per product
     - **Buttons on each card:**
       - "See more [type]" → `/maker/jobs` (filtered by type)

- **Top Navigation Tabs:**
  - **Dashboard** (current page)
  - **Shop** → `/maker/new-requests`
  - **Current Workflow** → `/maker/workflow`
  - **Devices** → `/maker/devices`

#### `/maker/jobs`
- **Features:**
  - Job listings with filtering
  - Filter buttons: All | Open Request | Quick Service | Closed Request
  - Job cards showing:
    - Job title
    - Material
    - Quantity
    - Tolerance tier
    - Deadline
    - Pay estimate
    - For open requests: Max quantity claimable
  - **Buttons:**
    - "View Details" → `/maker/jobs/[jobId]`
    - "Accept Job" (creates assignment or updates selected_manufacturer_id)

#### `/maker/jobs/[jobId]`
- **Features:**
  - Job details (title, description, specifications)
  - STL model viewer
  - Extended description (full client requirements)
  - Expected time
  - Materials/machine needed
  - Pay amount
  - For open requests: Quantity selection slider
  - **Buttons:**
    - "View Extended Description" (expandable)
    - "Accept Job" (for open requests: accepts specified quantity)
    - "Back to Jobs"

#### `/maker/jobs/active`
- **Features:**
  - List of active jobs (in_production, qc_pending, accepted)
  - Job cards with:
    - Product name
    - Client name
    - Deadline
    - Status
    - Progress
  - **Click card** → `/maker/jobs/active/[jobId]`

#### `/maker/jobs/active/[jobId]`
- **Features:**
  - Job details
  - STL model viewer (original design)
  - **Action Buttons:**
    - "View Description" (full requirements)
    - "View Time & Materials" (estimated time, materials, machine)
    - "View Pay" (payment details)
    - "Check Quality" → `/maker/jobs/qc/[jobId]`
    - "Ship" → `/maker/jobs/ship/[jobId]` (after QC passes)

#### `/maker/jobs/qc/[jobId]`
- **Features:**
  - Split screen:
    - **Left:** STL model reference (rotating 3D viewer)
    - **Right:** Photo upload section
  - Upload 4-6 photos (drag & drop or file picker)
  - Photo preview thumbnails
  - **Button:** "Compare to STL Model & Check Quality"
  - **After QC runs:**
    - Results displayed:
      - QC Score (0-1)
      - Status (Pass, Review, Fail)
      - Similarity score
      - Dimensional Accuracy
      - Surface Quality
      - Anomaly Score
      - Notes (issues found)
    - **Buttons:**
      - "Submit for Client Review" (if pass)
      - "Retry QC" (if fail/review)

#### `/maker/jobs/ship/[jobId]`
- **Features:**
  - Shipping form:
    - Carrier (dropdown: UPS, FedEx, USPS, DHL, Other)
    - Tracking Number
    - Estimated delivery date
  - **Buttons:**
    - "Mark as Shipped" (creates shipping record, triggers payment)
    - "Cancel"

#### `/maker/new-requests`
- **Features:**
  - List of new job requests
  - Same as `/maker/jobs` but filtered for new requests
  - Notification badge shows count

#### `/maker/workflow`
- **Features:**
  - AI-generated workflow schedule
  - Timeline view of all active jobs
  - Device utilization (which device is running what job)
  - Optimized task scheduling (from F4 model)
  - Calendar view (future)
  - **Buttons:**
    - "View Job Details" (for each scheduled task)
    - "Adjust Schedule" (manual override)

#### `/maker/financials`
- **Features:**
  - Earnings dashboard
  - Transaction history (all payments received)
  - Pending payments
  - Payment status breakdown
  - **Buttons:**
    - Filter by status
    - Export to CSV (future)

#### `/maker/commissions/[commissionId]`
- **Features:**
  - Long-term commission details
  - Weekly quota progress
  - Production history
  - **Buttons:**
    - "Mark as Complete" (for weekly quota items)
    - "View Production History"

---

## 🤖 All AI Models

### **F1: Maker Ranking Model** (`models/f1_maker_ranking.py`)
- **Purpose:** Ranks manufacturers for a specific job
- **Input:**
  - Job specs (material, tolerance_tier, quantity, deadline_days)
  - Manufacturer data (equipment, materials, capacity_score, quality_score, ratings, location)
- **Output:**
  - Ranked list of manufacturers with scores (0-1)
  - Explanations (why each manufacturer is ranked)
  - Completion time estimates
- **Algorithm:**
  - Multi-factor scoring:
    - Equipment match (25%)
    - Material compatibility (15%)
    - Capacity score (20%)
    - Quality score (20%)
    - Historical ratings (10%)
    - Location/distance (10%)
- **API Endpoint:** `POST /api/ai/rank` → `POST http://localhost:8000/api/ai/rank/`

### **F2: Fair Pay Estimator Model** (`models/f2_fair_pay_estimator.py`)
- **Purpose:** Calculates fair payment for a job
- **Input:**
  - Material, quantity, tolerance_tier
  - Estimated hours, setup hours
  - Deadline urgency
  - Market rate per hour
- **Output:**
  - Suggested pay (USD)
  - Pay range (low, high)
  - Breakdown (material cost, labor cost, overhead, margin)
- **Algorithm:**
  - Material cost calculation
  - Labor cost (hours × rate × complexity multiplier)
  - Setup time cost
  - Urgency premium (if deadline < standard delivery)
  - Fair margin (15-25%)
- **API Endpoint:** `POST /api/ai/pay` → `POST http://localhost:8000/api/ai/pay/`

### **F3: Vision Quality Check Model** (`models/f3_vision_quality_check.py`)
- **Purpose:** Compares manufactured part photos to STL design
- **Input:**
  - STL file path/URL
  - Evidence photo paths/URLs (4-6 photos)
  - Tolerance tier
  - Critical dimensions (optional)
- **Output:**
  - QC Score (0-1, overall quality)
  - Status (pass, review, fail)
  - Similarity (0-1, visual similarity to STL)
  - Dimensional Accuracy (0-1)
  - Surface Quality (0-1)
  - Anomaly Score (0-1, higher = fewer defects)
  - Notes (issues found)
- **Algorithm:**
  - **STL Analysis:**
    - Calculate volume (signed volume method)
    - Calculate surface area
    - Bounding box dimensions
    - Mesh quality assessment
  - **Image Analysis:**
    - Histogram analysis (color distribution)
    - Edge detection (Canny)
    - Texture analysis (variance)
    - Feature extraction
  - **Comparison:**
    - Feature similarity matching
    - Dimensional comparison (aspect ratios, estimated sizes)
    - Anomaly detection (edge irregularities, surface defects)
  - **Scoring:**
    - Weighted combination: Similarity (35%) + Anomaly (25%) + Dimensional (15%) + Surface (15%) + Consistency (10%)
- **API Endpoint:** `POST /api/ai/qc` → `POST http://localhost:8000/api/ai/qc/`

### **F4: Workflow Scheduling Model** (`models/f4_workflow_scheduling.py`)
- **Purpose:** Optimizes manufacturer's task schedule
- **Input:**
  - List of active jobs (deadlines, estimated hours, device requirements)
  - Available devices (device_id, status, capabilities)
  - Current time
- **Output:**
  - Optimized schedule (tasks ordered by priority)
  - Device assignments (which device does what, when)
  - Timeline visualization
  - Utilization metrics
- **Algorithm:**
  - Deadline-based prioritization
  - Device compatibility matching
  - Time-block allocation
  - Conflict resolution (if device busy)
  - Profit optimization (balance fast jobs vs. high-value jobs)
- **API Endpoint:** `POST /api/ai/workflow` → `POST http://localhost:8000/api/ai/workflow/`

### **Time Calculator** (`models/time_calculator.py`)
- **Purpose:** Estimates completion time for jobs
- **Input:** Manufacturer behavior history, job complexity, quantity
- **Output:** Estimated hours, delivery date
- **Used by:** F1 ranking (completion time estimates)

### **Earnings Calculator** (`lib/pricingCalculator.ts`)
- **Purpose:** Frontend pricing calculation (fallback if API fails)
- **Input:** Material, quantity, tolerance, hours
- **Output:** Price estimate

### **Completion Time Estimator** (`lib/completionTimeEstimator.ts`)
- **Purpose:** Estimates completion time based on manufacturer capacity
- **Input:** Manufacturer scores, job complexity, quantity
- **Output:** Estimated completion date

### **Rating Aggregator** (`models/f1_maker_ranking.py` + `api/routes/rate.py`)
- **Purpose:** Aggregates ratings from multiple jobs into overall manufacturer rating
- **Input:** Individual job ratings, QC scores, timeliness
- **Output:** Average rating, total jobs completed, total ratings received

---

## 🔌 All API Endpoints

### **Authentication APIs**

#### `POST /api/auth/session`
- **Purpose:** Get current user session
- **Returns:** User data or null

#### `GET /api/auth/sign-out`
- **Purpose:** Sign out user
- **Redirects:** To homepage

---

### **Job Management APIs**

#### `POST /api/jobs`
- **Purpose:** Create a new job
- **Body:**
  ```json
  {
    "order": {
      "title": "Product Name",
      "quantity": 100,
      "material": "ABS",
      "orderType": "open-request",
      "toleranceThou": 0.005,
      "deadline": "2026-02-01",
      "stlUrl": "https://...",
      ...
    },
    "ai": {
      "priceEstimate": {...},
      "manufacturerMatches": [...]
    }
  }
  ```
- **Returns:** `{ job_id, selected_manufacturer_id, auto_distributed }`
- **Auto-actions:**
  - Creates job in database
  - Stores pay estimate
  - Stores manufacturer recommendations (F1 results)
  - **If open-request with quantity ≥ 100:** Auto-distributes to multiple manufacturers

#### `GET /api/jobs/[jobId]`
- **Purpose:** Get job details
- **Returns:** Full job data including specifications, STL URL, status

#### `POST /api/jobs/auto-distribute`
- **Purpose:** Automatically distribute open request to multiple manufacturers
- **Body:** `{ job_id }`
- **Returns:** `{ message, assignments, total_assigned, remaining }`
- **Algorithm:**
  - Gets top-ranked manufacturers (from job_recommendations)
  - Distributes units proportionally based on rank × capacity × quality
  - Creates job_assignments for each manufacturer
  - Updates job status to 'assigned'

#### `POST /api/jobs/[jobId]/assignments`
- **Purpose:** Get all assignments for a job, or create new assignment
- **GET:** Returns list of assignments
- **POST:** Creates new assignment (manufacturer accepts portion of open request)
- **Body:** `{ assigned_quantity, estimated_delivery_date, pay_amount_cents }`

#### `POST /api/jobs/[jobId]/qc`
- **Purpose:** Persist QC results to database
- **Body:**
  ```json
  {
    "qc_score": 0.85,
    "status": "pass",
    "similarity": 0.90,
    "evidence_paths": ["url1", "url2", ...],
    "model_version": "v1.0"
  }
  ```
- **Returns:** QC record ID

#### `POST /api/jobs/[jobId]/ship`
- **Purpose:** Mark job as shipped
- **Body:**
  ```json
  {
    "carrier": "UPS",
    "tracking_number": "1Z999AA10123456784",
    "estimated_delivery_date": "2026-02-05"
  }
  ```
- **Actions:**
  - Creates shipping record
  - Updates job status to 'accepted'
  - Triggers payment (updates financial_transactions status)

#### `GET /api/jobs/[jobId]/messages`
- **Purpose:** Get all messages for a job
- **Returns:** Array of messages (sender, recipient, body, timestamp)

#### `POST /api/jobs/[jobId]/messages`
- **Purpose:** Send a message (client ↔ manufacturer)
- **Body:** `{ recipient_id, body }`
- **Returns:** Created message

---

### **AI Model APIs**

#### `POST /api/ai/rank`
- **Purpose:** F1 Maker Ranking - Rank manufacturers for a job
- **Body:**
  ```json
  {
    "job_id": "uuid",
    // OR
    "material": "ABS",
    "tolerance_tier": "medium",
    "quantity": 100,
    "deadline_days": 14
  }
  ```
- **Returns:**
  ```json
  [
    {
      "manufacturer_id": "uuid",
      "rank_score": 0.92,
      "explanations": {...},
      "completion_time_estimate": {...}
    },
    ...
  ]
  ```
- **Backend:** Calls `POST http://localhost:8000/api/ai/rank/`

#### `POST /api/ai/pay`
- **Purpose:** F2 Fair Pay Estimator - Calculate fair payment
- **Body:**
  ```json
  {
    "material": "ABS",
    "quantity": 100,
    "tolerance_tier": "medium",
    "estimated_hours": 20.0,
    "setup_hours": 1.0,
    "deadline_days": 14,
    "standard_delivery_days": 14,
    "market_rate_per_hour": 45.0
  }
  ```
- **Returns:**
  ```json
  {
    "suggested_pay": 950.0,
    "range_low": 807.5,
    "range_high": 1092.5,
    "breakdown": {
      "material_cost": 50.0,
      "labor_cost": 900.0,
      "overhead": 75.0,
      "margin": 125.0
    },
    "model_version": "v1.0"
  }
  ```
- **Backend:** Calls `POST http://localhost:8000/api/ai/pay/`

#### `POST /api/ai/qc`
- **Purpose:** F3 Vision Quality Check - Compare photos to STL
- **Body:**
  ```json
  {
    "job_id": "uuid",
    "stl_file_url": "https://supabase.co/storage/...",
    "evidence_photo_urls": ["https://...", "https://..."],
    "tolerance_tier": "medium",
    "tolerance_thou": 0.005,
    "material": "ABS",
    "critical_dimensions": {"width": 10.0, "height": 5.0}
  }
  ```
- **Returns:**
  ```json
  {
    "qc_score": 0.85,
    "status": "pass",
    "similarity": 0.90,
    "dimensional_accuracy": 0.88,
    "surface_quality": 0.82,
    "anomaly_score": 0.91,
    "notes": ["Minor surface imperfections", "Dimensions within tolerance"],
    "confidence": 0.87,
    "model_version": "v1.0"
  }
  ```
- **Backend:** Calls `POST http://localhost:8000/api/ai/qc/`
- **Actions:**
  - Downloads STL from Supabase Storage
  - Downloads photos from Supabase Storage
  - Runs F3 model analysis
  - Cleans up temp files

#### `POST /api/ai/workflow`
- **Purpose:** F4 Workflow Scheduling - Optimize manufacturer's schedule
- **Body:**
  ```json
  {
    "manufacturer_id": "uuid",
    "active_jobs": [
      {
        "job_id": "uuid",
        "deadline": "2026-02-01T00:00:00Z",
        "estimated_hours": 12.0,
        "device_type": "cnc_mill",
        "priority": 1
      },
      ...
    ],
    "available_devices": [
      {
        "device_id": "uuid",
        "device_type": "cnc_mill",
        "status": "active",
        "capabilities": {...}
      },
      ...
    ]
  }
  ```
- **Returns:**
  ```json
  {
    "schedule": [
      {
        "job_id": "uuid",
        "device_id": "uuid",
        "start_time": "2026-01-15T08:00:00Z",
        "end_time": "2026-01-15T20:00:00Z",
        "priority": 1
      },
      ...
    ],
    "device_utilization": {...},
    "optimization_score": 0.92
  }
  ```
- **Backend:** Calls `POST http://localhost:8000/api/ai/workflow/`

#### `POST /api/ai/rate`
- **Purpose:** Rating Aggregator - Calculate overall manufacturer rating
- **Body:**
  ```json
  {
    "manufacturer_id": "uuid",
    "job_ratings": [
      {"rating": 5, "qc_score": 0.9, "timeliness": 0.95},
      ...
    ]
  }
  ```
- **Returns:**
  ```json
  {
    "average_rating": 4.8,
    "total_jobs_completed": 50,
    "total_ratings_received": 45,
    "quality_score": 0.92
  }
  ```
- **Backend:** Calls `POST http://localhost:8000/api/ai/rate/`

---

### **Other APIs**

#### `GET /api/financials`
- **Purpose:** Get financial transactions for current user
- **Query params:** `?status=pending` (optional filter)
- **Returns:** Array of transactions

#### `GET /api/manufacturers/by-user/[userId]`
- **Purpose:** Get manufacturer data by user ID
- **Returns:** Manufacturer profile with devices, materials, scores

---

## 🔘 All Buttons & Actions

### **Homepage (`/`)**
- "Client Dashboard" (dev mode button)
- "Maker Dashboard" (dev mode button)
- "Get Started" (navigation link)
- "Features" (scroll to features section)
- "Solutions" (scroll to solutions section)
- Hamburger menu (mobile)

### **Sign Up (`/auth/sign-up`)**
- "Manufacturer" (choose account type)
- "Client" (choose account type)
- "Continue with Google" (OAuth)
- "Create Account" (Email/Password form submit)
- "Sign In" (link to sign-in page)

### **Sign In (`/auth/sign-in`)**
- "Sign In" (form submit)
- "Continue with Google" (OAuth)
- "Sign Up" (link to sign-up page)

### **Complete Profile (`/auth/complete-profile`)**
- **Manufacturer:**
  - "Next" (steps 1-3)
  - "Back" (steps 2-4)
  - "Complete Profile" (step 4)
  - "+ Add Device" (step 3)
  - "Remove" (for each device)
- **Client:**
  - "Complete Profile"

### **Client Dashboard (`/client/dashboard`)**
- "New" (dropdown menu)
  - "Open Request"
  - "Open Quick Service"
  - "Closed Request"
  - "Closed Commission"
- Profile icon dropdown
  - "Profile"
  - "Sign Out"
- Notification bell
- Click ongoing service card → Go to workflow page
- "View & Message →" link → Go to job details page

### **New Order (`/client/new-order`)**
- "Choose File" (STL upload)
- "Continue to AI Analysis"
- Color picker (if Paint coating selected)
- Material dropdown

### **Processing (`/client/new-order/processing`)**
- "Submit Order"
- "Back to Edit"

### **Job Details (`/client/jobs/[jobId]`)**
- "Send Message" (opens message composer)
- "View Workflow" (for multi-manufacturer jobs)
- Message input field + "Send" button

### **Workflow (`/client/jobs/[jobId]/workflow`)**
- "View Job Details"
- "Message [Manufacturer Name]" (for each assignment)

### **Maker Dashboard (`/maker/dashboard`)**
- **Top Navigation:**
  - "Dashboard" tab
  - "Shop" tab → `/maker/new-requests`
  - "Current Workflow" tab → `/maker/workflow`
  - "Devices" tab → `/maker/devices`
- **Stats Section:**
  - "See devices" → `/maker/devices`
  - "View All Stats"
  - "View Financials" → `/maker/financials`
- **Ongoing Services:**
  - Left/Right arrow buttons (scroll)
  - Click card → `/maker/jobs/active/[jobId]`
- **Recommendations:**
  - "See more [type]" → `/maker/jobs` (filtered)
- Profile icon dropdown
  - "Profile"
  - "Sign Out"
- Notification bell

### **Jobs (`/maker/jobs`)**
- Filter buttons: "All | Open Request | Quick Service | Closed Request"
- "View Details" → `/maker/jobs/[jobId]`
- "Accept Job" (creates assignment)

### **Job Details (`/maker/jobs/[jobId]`)**
- "View Extended Description" (expandable)
- "Accept Job" (for open requests: quantity slider appears)
- "Back to Jobs"

### **Active Jobs (`/maker/jobs/active`)**
- Click job card → `/maker/jobs/active/[jobId]`

### **Active Job Details (`/maker/jobs/active/[jobId]`)**
- "View Description"
- "View Time & Materials"
- "View Pay"
- "Check Quality" → `/maker/jobs/qc/[jobId]`
- "Ship" → `/maker/jobs/ship/[jobId]` (after QC)

### **QC Submission (`/maker/jobs/qc/[jobId]`)**
- "Choose Files" (photo upload, 4-6 photos)
- "Remove" (for each uploaded photo)
- "Compare to STL Model & Check Quality"
- **After QC:**
  - "Submit for Client Review" (if pass)
  - "Retry QC" (if fail/review)

### **Shipping (`/maker/jobs/ship/[jobId]`)**
- Carrier dropdown
- Tracking number input
- "Mark as Shipped"
- "Cancel"

### **Workflow (`/maker/workflow`)**
- "View Job Details" (for each scheduled task)
- "Adjust Schedule" (manual override)

### **Financials (`/maker/financials` or `/client/financials`)**
- Filter buttons: "All | Pending | Paid | Failed"
- Export button (future)

---

## 🗄️ Database Structure

### **Core Tables**

#### `profiles`
- `id` UUID (FK to auth.users)
- `role` user_role ('client', 'manufacturer', 'admin')
- `name` TEXT
- `email` TEXT
- `client_type` TEXT (individual, small_business, corporation)
- `business_type` TEXT
- `company_name` TEXT
- `phone` TEXT
- `address` TEXT
- `city` TEXT
- `state` TEXT
- `zip_code` TEXT
- `bio` TEXT
- `average_rating` FLOAT
- `total_jobs_completed` INTEGER
- `total_ratings_received` INTEGER
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

#### `manufacturers`
- `id` UUID (FK to profiles.id)
- `location_state` TEXT
- `location_zip` TEXT
- `equipment` JSONB (legacy)
- `materials` TEXT[]
- `tolerance_tier` tolerance_tier ('low', 'medium', 'high')
- `capacity_score` FLOAT (0-1)
- `quality_score` FLOAT (0-1)
- `average_rating` FLOAT
- `total_jobs_completed` INTEGER
- `total_ratings_received` INTEGER
- `total_earnings` FLOAT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

#### `manufacturer_devices`
- `id` UUID
- `manufacturer_id` UUID (FK to manufacturers.id)
- `device_name` TEXT
- `device_type` TEXT
- `device_model` TEXT
- `status` TEXT ('active', 'inactive', 'maintenance')
- `capabilities` JSONB
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

#### `jobs`
- `id` UUID
- `client_id` UUID (FK to profiles.id)
- `title` TEXT
- `description` TEXT
- `material` TEXT
- `quantity` INTEGER
- `tolerance_tier` tolerance_tier
- `tolerance_thou` FLOAT
- `deadline` TIMESTAMPTZ
- `status` job_status ('draft', 'posted', 'assigned', 'in_production', 'qc_pending', 'qc_done', 'accepted', 'disputed', 'resolved')
- `order_type` TEXT ('open-request', 'quick-service', 'closed-request', 'closed-commission')
- `selected_manufacturer_id` UUID (FK to profiles.id, NULL for open requests)
- `stl_path` TEXT (legacy)
- `stl_url` TEXT
- `manufacturing_types` TEXT[]
- `finish_details` TEXT
- `coatings` TEXT[]
- `screw_dimensions` TEXT
- `paint_color` TEXT
- `assigned_quantity` INTEGER (for single manufacturer jobs)
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

#### `job_recommendations`
- `id` UUID
- `job_id` UUID (FK to jobs.id)
- `manufacturer_id` UUID (FK to profiles.id)
- `rank_score` FLOAT (0-1)
- `explanations` JSONB
- `model_version` TEXT
- `created_at` TIMESTAMPTZ
- UNIQUE(job_id, manufacturer_id)

#### `job_assignments`
- `id` UUID
- `job_id` UUID (FK to jobs.id)
- `manufacturer_id` UUID (FK to profiles.id)
- `assigned_quantity` INTEGER
- `estimated_delivery_date` TIMESTAMPTZ
- `status` TEXT ('accepted', 'in_production', 'qc_pending', 'shipped', 'delivered', 'cancelled')
- `completed_quantity` INTEGER
- `pay_amount_cents` INTEGER
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ
- UNIQUE(job_id, manufacturer_id)

#### `pay_estimates`
- `id` UUID
- `job_id` UUID (FK to jobs.id, UNIQUE)
- `suggested_pay` FLOAT
- `range_low` FLOAT
- `range_high` FLOAT
- `breakdown` JSONB
- `model_version` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

#### `qc_records`
- `id` UUID
- `job_id` UUID (FK to jobs.id)
- `manufacturer_id` UUID (FK to profiles.id)
- `qc_score` FLOAT (0-1)
- `status` qc_status ('pass', 'review', 'fail')
- `similarity` FLOAT (0-1)
- `dimensional_accuracy` FLOAT (0-1)
- `surface_quality` FLOAT (0-1)
- `evidence_paths` TEXT[]
- `model_version` TEXT
- `created_at` TIMESTAMPTZ

#### `job_messages`
- `id` UUID
- `job_id` UUID (FK to jobs.id)
- `sender_id` UUID (FK to profiles.id)
- `recipient_id` UUID (FK to profiles.id)
- `body` TEXT
- `created_at` TIMESTAMPTZ

#### `shipping_records`
- `id` UUID
- `job_id` UUID (FK to jobs.id, UNIQUE)
- `manufacturer_id` UUID (FK to profiles.id)
- `carrier` TEXT
- `tracking_number` TEXT
- `shipped_at` TIMESTAMPTZ
- `delivered_at` TIMESTAMPTZ
- `created_at` TIMESTAMPTZ

#### `financial_transactions`
- `id` UUID
- `job_id` UUID (FK to jobs.id)
- `client_id` UUID (FK to profiles.id)
- `manufacturer_id` UUID (FK to profiles.id)
- `amount_cents` INTEGER
- `currency` TEXT (default 'USD')
- `status` transaction_status ('pending', 'authorized', 'paid', 'failed', 'refunded')
- `kind` TEXT (default 'job_payment')
- `description` TEXT
- `created_at` TIMESTAMPTZ
- `updated_at` TIMESTAMPTZ

#### `disputes`
- `id` UUID
- `job_id` UUID (FK to jobs.id)
- `client_id` UUID (FK to profiles.id)
- `manufacturer_id` UUID (FK to profiles.id)
- `reason` TEXT
- `status` dispute_status ('open', 'resolved')
- `resolution` TEXT
- `resolved_by` UUID (FK to profiles.id)
- `created_at` TIMESTAMPTZ
- `resolved_at` TIMESTAMPTZ

---

## ✅ Complete Feature List

### **Authentication & User Management**
- ✅ Email/Password sign-up
- ✅ Google OAuth sign-up
- ✅ Email/Password sign-in
- ✅ Google OAuth sign-in
- ✅ Email verification (can be disabled)
- ✅ Auto-confirm users (via trigger)
- ✅ Multi-step profile completion (Manufacturer: 4 steps, Client: 1 step)
- ✅ Role-based access (Client, Manufacturer, Admin)
- ✅ Session management
- ✅ Sign out

### **Client Features**
- ✅ Create new orders (4 types: Open Request, Quick Service, Closed Request, Closed Commission)
- ✅ Upload STL files with 3D preview
- ✅ Detailed order specifications (tolerance, materials, finish, coatings, etc.)
- ✅ AI-powered price estimation (F2)
- ✅ AI-powered manufacturer matching (F1)
- ✅ View ongoing services (jobs in progress)
- ✅ Track workflow for multi-manufacturer jobs
- ✅ View job assignments (who's making what, quantities, deadlines)
- ✅ Message manufacturers (in-job chat)
- ✅ View job details and history
- ✅ View financial transactions
- ✅ Filter financials by status

### **Manufacturer Features**
- ✅ View job recommendations (Open Requests, Quick Services)
- ✅ Accept jobs (full or partial quantities)
- ✅ View active jobs
- ✅ View workflow schedule (AI-optimized via F4)
- ✅ Submit quality check (upload 4-6 photos)
- ✅ AI-powered QC comparison (F3: photos vs STL)
- ✅ Ship products with tracking
- ✅ View earnings and financials
- ✅ Manage devices (equipment inventory)
- ✅ View stats (devices, parts manufactured, dollars made)
- ✅ View long-term commissions
- ✅ Message clients (in-job chat)

### **AI Models & Features**
- ✅ **F1: Maker Ranking** - Ranks manufacturers for jobs
- ✅ **F2: Fair Pay Estimator** - Calculates fair payment
- ✅ **F3: Vision Quality Check** - Compares photos to STL files
- ✅ **F4: Workflow Scheduling** - Optimizes manufacturer schedules
- ✅ **Time Calculator** - Estimates completion time
- ✅ **Earnings Calculator** - Frontend pricing fallback
- ✅ **Rating Aggregator** - Calculates overall manufacturer ratings
- ✅ **Auto-Distribution** - Splits large open requests among manufacturers

### **Job Management**
- ✅ Create jobs with detailed specifications
- ✅ STL file upload and storage
- ✅ Multiple order types (Open Request, Quick Service, Closed Request, Closed Commission)
- ✅ Multi-manufacturer assignments (for open requests)
- ✅ Job status tracking (draft, posted, assigned, in_production, qc_pending, qc_done, accepted, etc.)
- ✅ Job recommendations (F1 results stored)
- ✅ Pay estimates (F2 results stored)
- ✅ Quality check records (F3 results stored)
- ✅ Shipping tracking
- ✅ Financial transaction creation

### **Communication**
- ✅ In-job messaging (client ↔ manufacturer)
- ✅ Message history per job
- ✅ Real-time message display

### **Storage**
- ✅ STL file storage (Supabase Storage bucket: `stl-files`)
- ✅ QC photo storage (Supabase Storage bucket: `qc-photos`)
- ✅ Public bucket access (with RLS policies)

### **UI/UX**
- ✅ Dark navy blue color scheme
- ✅ White House-style fonts (Trajan Pro for headings, Montserrat for body)
- ✅ Sharp corners (no rounded corners)
- ✅ No shadows
- ✅ Scroll-triggered animations
- ✅ Rotating STL 3D viewer (Three.js)
- ✅ Horizontal scrolling sections
- ✅ Progress bars
- ✅ Status badges
- ✅ Notification badges
- ✅ Dropdown menus
- ✅ Mobile-responsive

### **Data & Analytics**
- ✅ Manufacturer capacity scores
- ✅ Manufacturer quality scores
- ✅ Job completion tracking
- ✅ Ratings aggregation
- ✅ Earnings tracking
- ✅ Financial transaction history
- ✅ Device utilization (from workflow)

### **Security & Access Control**
- ✅ Row Level Security (RLS) policies
- ✅ Authenticated-only access to dashboards
- ✅ Profile-based permissions
- ✅ Secure file uploads (Supabase Storage)
- ✅ Service role key for admin operations

### **Developer Features**
- ✅ Dev mode testing buttons (homepage)
- ✅ FastAPI backend (http://localhost:8000)
- ✅ Next.js dev server (http://localhost:3000)
- ✅ Comprehensive error handling
- ✅ Fallback calculations (if AI APIs fail)
- ✅ Environment variable configuration

---

## 🎯 Complete System Capabilities Summary

**You can:**
1. **Sign up** as Client or Manufacturer (Email/Password or Google)
2. **Complete profile** with detailed information
3. **Create orders** with STL files and detailed specifications
4. **Get AI price estimates** (F2)
5. **Get AI manufacturer matches** (F1)
6. **Auto-distribute** large orders to multiple manufacturers
7. **Accept jobs** as manufacturer (full or partial quantities)
8. **Track workflow** with AI-optimized scheduling (F4)
9. **Submit quality checks** with photo uploads
10. **Compare photos to STL** using AI (F3)
11. **Ship products** with tracking
12. **Message** between client and manufacturer
13. **View financials** (earnings, payments, transactions)
14. **Manage devices** (equipment inventory)
15. **View stats** (parts manufactured, dollars made, devices)

**The system has:**
- 21 pages/routes
- 17 API endpoints
- 12 database tables
- 8 AI/business logic models
- 4 order types
- 3 user roles
- 2 storage buckets
- Complete end-to-end workflow from order creation to payment

---

**This is a fully functional distributed manufacturing marketplace demo with AI-powered features, multi-user workflows, and comprehensive job management!** 🚀

