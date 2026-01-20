# 📁 Project Structure - M.A.M.A

## 🗂️ Complete Directory Organization

```
gdd/
│
├── 📱 apps/web/                    # Next.js Frontend Application
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API Routes (Next.js)
│   │   │   ├── ai/                 # AI endpoints (F1-F4)
│   │   │   ├── auth/               # Authentication
│   │   │   ├── jobs/               # Job management
│   │   │   ├── financials/         # Financial transactions
│   │   │   └── manufacturers/      # Manufacturer data
│   │   ├── auth/                   # Auth pages
│   │   │   ├── sign-up/            # Registration
│   │   │   ├── sign-in/            # Login
│   │   │   ├── complete-profile/   # Profile completion
│   │   │   └── callback/           # OAuth callback
│   │   ├── client/                 # Client user pages
│   │   │   ├── dashboard/          # Client dashboard
│   │   │   ├── new-order/          # Create orders
│   │   │   ├── jobs/               # Job details & workflow
│   │   │   └── financials/         # Client financials
│   │   ├── maker/                  # Manufacturer user pages
│   │   │   ├── dashboard/          # Maker dashboard
│   │   │   ├── jobs/               # Job listings & details
│   │   │   ├── workflow/           # Workflow schedule
│   │   │   ├── financials/         # Earnings
│   │   │   └── commissions/        # Long-term commissions
│   │   └── page.tsx                # Homepage
│   ├── components/                 # React Components
│   │   ├── auth/                   # Auth components
│   │   ├── STLViewer.tsx           # 3D STL viewer
│   │   └── JobMessages.tsx         # Messaging component
│   ├── lib/                        # Utilities & Helpers
│   │   ├── supabase/               # Supabase clients
│   │   ├── authErrors.ts           # Error handling
│   │   ├── pricingCalculator.ts    # Price calculations
│   │   └── completionTimeEstimator.ts
│   ├── public/                     # Static assets
│   │   └── *.svg, *.jpg, *.png     # Images & icons
│   ├── package.json                # Dependencies
│   └── tsconfig.json               # TypeScript config
│
├── 🐍 api/                         # FastAPI Backend Server
│   ├── routes/                     # API Route Handlers
│   │   ├── pay.py                  # F2: Pay Estimator
│   │   ├── rank.py                 # F1: Maker Ranking
│   │   ├── qc.py                   # F3: Quality Check
│   │   ├── workflow.py             # F4: Workflow Scheduling
│   │   └── rate.py                 # Rating Aggregator
│   ├── main.py                     # FastAPI server entry
│   ├── requirements.txt            # Python dependencies
│   ├── start.sh                    # Start script
│   ├── setup.sh                    # Setup script
│   └── venv/                       # Python virtual environment
│
├── 🤖 models/                      # AI Model Implementations
│   ├── f1_maker_ranking.py         # F1: Maker Ranking Model
│   ├── f2_fair_pay_estimator.py    # F2: Fair Pay Estimator
│   ├── f3_vision_quality_check.py  # F3: Vision Quality Check
│   ├── f4_workflow_scheduling.py   # F4: Workflow Scheduling
│   ├── business_logic.py           # Business logic helpers
│   ├── time_calculator.py          # Time estimation
│   ├── requirements.txt            # Model dependencies
│   └── MODEL_ARCHITECTURES.md      # Model documentation
│
├── 🗄️ supabase/                    # Database & Scripts
│   ├── RUN_THIS_IN_SUPABASE.sql    # ⭐ MAIN MIGRATION (run this first!)
│   ├── FIX_INFINITE_RECURSION.sql  # Fix for profile RLS
│   ├── AUTO_CONFIRM_USERS.sql      # Auto-confirm users
│   ├── create_50_manufacturers.py  # Create 50 demo manufacturers
│   ├── create_jobs_and_workflows.py # Create sample jobs
│   ├── seed_users.py               # Seed users script
│   ├── run_seed.sh                 # Seed script runner
│   └── migrations/                 # Individual migration files
│       ├── 001_initial_schema.sql
│       ├── 002_auth_profile_fields.sql
│       ├── 003_extended_user_schema.sql
│       ├── 004_messaging_shipping_financials.sql
│       └── 005_job_assignments_workflow.sql
│
├── 📚 docs/                        # Documentation
│   ├── PROJECT_PAPER.html          # ⭐ Official 10-page paper (PDF-ready)
│   ├── COMPLETE_SYSTEM_OVERVIEW.md # Complete system documentation
│   ├── README.md                   # Documentation index
│   ├── setup/                      # Setup Instructions
│   │   ├── AUTH_SETUP.md
│   │   ├── GOOGLE_OAUTH_SETUP.md
│   │   ├── DISABLE_EMAIL_VERIFICATION.md
│   │   ├── INSTALL_PIP_INSTRUCTIONS.md
│   │   ├── RUN_MIGRATIONS_NOW.md
│   │   ├── SETUP_DEMO_USERS.md
│   │   ├── SUPABASE_STORAGE_SETUP.md
│   │   └── SUPABASE_STORAGE_POLICIES_EXACT_STEPS.md
│   ├── guides/                     # How-to Guides
│   │   ├── COMPLETE_SETUP_GUIDE.md
│   │   ├── QUICK_START_GUIDE.md
│   │   ├── QUICK_START_DEMO.md
│   │   ├── DEMO_SETUP_COMPLETE.md
│   │   ├── COMPLETE_AI_INTEGRATION_CHECKLIST.md
│   │   ├── DEMO_CHECKLIST.md
│   │   ├── IMPLEMENTATION_PLAN.md
│   │   └── TESTING_SUMMARY.md
│   └── status/                     # Project Status
│       ├── COMPLETE_STATUS.md
│       ├── DEMO_COMPLETION_STATUS.md
│       ├── PRODUCTION_STATUS.md
│       └── QUICK_STATUS.md
│
├── 📦 packages/                    # Shared Code
│   └── shared/
│       └── types.ts                # Shared TypeScript types
│
├── 📄 HOW_TO_RUN.md                # ⭐ Step-by-step run instructions
├── 📄 PROJECT_STRUCTURE.md         # This file
├── 📄 README.md                    # Main project README
└── 📄 package.json                 # Root package.json (if any)
```

---

## 🎯 Key Files & Their Purpose

### **Setup Files (Run These First):**
1. `supabase/RUN_THIS_IN_SUPABASE.sql` - **Run in Supabase SQL Editor first!**
2. `supabase/AUTO_CONFIRM_USERS.sql` - Disable email verification
3. `supabase/create_50_manufacturers.py` - Create demo users

### **Run Scripts:**
- `HOW_TO_RUN.md` - Complete run instructions
- `api/start.sh` - Start FastAPI server
- `supabase/run_seed.sh` - Run seed scripts

### **Documentation:**
- `docs/PROJECT_PAPER.html` - Official 10-page paper (open → Print to PDF)
- `docs/COMPLETE_SYSTEM_OVERVIEW.md` - Full system documentation
- `docs/setup/` - All setup guides
- `docs/guides/` - All how-to guides

---

## 🚀 Quick Start Commands

### **Start Everything:**
```bash
# Terminal 1: Frontend
cd apps/web && npm run dev -- --port 3000

# Terminal 2: Backend
cd api && source venv/bin/activate && python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### **Create Demo Data:**
```bash
cd supabase
export SUPABASE_SERVICE_ROLE_KEY="your-key"
python3 create_50_manufacturers.py
```

### **View Documentation:**
- Open: `docs/PROJECT_PAPER.html` in browser
- Print to PDF: `Ctrl+P` → Save as PDF

---

## ✅ No Random Files

All files are organized into:
- **Code:** `apps/web/`, `api/`, `models/`
- **Database:** `supabase/`
- **Documentation:** `docs/` (with subfolders: `setup/`, `guides/`, `status/`)
- **Shared:** `packages/`
- **Root:** Only essential files (`README.md`, `HOW_TO_RUN.md`, `PROJECT_STRUCTURE.md`, `package.json`)

---

**Everything is organized and ready to run!** 🎉


