# 📄 Project M.A.M.A Documentation

## 🎯 Main Documents

### **Official Paper Document (10 Pages)**
- **Location:** `docs/PROJECT_PAPER.html`
- **How to Use:**
  1. Open `PROJECT_PAPER.html` in your browser
  2. Press `Ctrl+P` (or `Cmd+P` on Mac)
  3. Select "Save as PDF"
  4. Save the PDF
- **Live Updates:** Edit the HTML file, save, refresh browser, re-export to PDF

### **Complete System Overview**
- **Location:** `COMPLETE_SYSTEM_OVERVIEW.md` (in root)
- Comprehensive guide to all features, pages, APIs, models, and capabilities

---

## 📁 Documentation Structure

### **Setup Guides** (`docs/setup/`)
- `AUTH_SETUP.md` - Authentication setup
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth configuration
- `GOOGLE_OAUTH_TROUBLESHOOTING.md` - OAuth troubleshooting
- `DISABLE_EMAIL_VERIFICATION.md` - Disable email verification
- `INSTALL_PIP_INSTRUCTIONS.md` - Python package installation
- `PYTHON_SETUP_COMPLETE.md` - Python environment setup
- `RUN_MIGRATIONS_NOW.md` - Database migration instructions
- `SETUP_DEMO_USERS.md` - Demo user setup
- `SUPABASE_STORAGE_SETUP.md` - Storage bucket setup
- `SUPABASE_STORAGE_POLICIES_EXACT_STEPS.md` - Storage policies

### **Guides** (`docs/guides/`)
- `COMPLETE_SETUP_GUIDE.md` - Complete setup walkthrough
- `QUICK_START_GUIDE.md` - Quick start instructions
- `QUICK_START_DEMO.md` - Demo quick start
- `DEMO_SETUP_COMPLETE.md` - Demo setup completion
- `COMPLETE_AI_INTEGRATION_CHECKLIST.md` - AI integration checklist
- `DEMO_CHECKLIST.md` - Demo checklist
- `IMPLEMENTATION_PLAN.md` - Implementation plan
- `ERROR_HANDLING_IMPROVEMENTS.md` - Error handling
- `MISSING_ENDPOINTS.md` - Missing endpoints tracker
- `MODELS_SUMMARY.md` - AI models summary
- `TESTING_SUMMARY.md` - Testing summary

### **Status Documents** (`docs/status/`)
- `COMPLETE_STATUS.md` - Overall completion status
- `DEMO_COMPLETION_STATUS.md` - Demo completion status
- `PRODUCTION_STATUS.md` - Production readiness
- `QUICK_STATUS.md` - Quick status summary
- `SECTION_1_COMPLETE.md` - Section 1 completion
- `FIXED_DATACLASS.md` - Dataclass fixes

---

## 🗄️ Database & SQL

### **Supabase** (`supabase/`)
- `RUN_THIS_IN_SUPABASE.sql` - **MAIN MIGRATION FILE** (run this first!)
- `FIX_INFINITE_RECURSION.sql` - Fix for profile RLS recursion
- `AUTO_CONFIRM_USERS.sql` - Auto-confirm users (disable email verification)
- `migrations/` - Individual migration files (001-005)
- `create_50_manufacturers.py` - Create 50 verified manufacturers
- `create_jobs_and_workflows.py` - Create sample jobs and workflows
- `seed_users.py` - Seed users script

---

## 🤖 AI Models

### **Models** (`models/`)
- `f1_maker_ranking.py` - F1: Maker Ranking Model
- `f2_fair_pay_estimator.py` - F2: Fair Pay Estimator
- `f3_vision_quality_check.py` - F3: Vision Quality Check
- `f4_workflow_scheduling.py` - F4: Workflow Scheduling
- `business_logic.py` - Business logic helpers
- `time_calculator.py` - Time estimation
- `MODEL_ARCHITECTURES.md` - Model architecture documentation

---

## 🚀 Quick Links

- **Main README:** `README.md` (root)
- **System Overview:** `COMPLETE_SYSTEM_OVERVIEW.md` (root)
- **Official Paper:** `docs/PROJECT_PAPER.html`
- **Database Migrations:** `supabase/RUN_THIS_IN_SUPABASE.sql`

---

## 📝 Notes

All documentation is organized by category:
- **Setup** = Step-by-step setup instructions
- **Guides** = How-to guides and checklists
- **Status** = Project status and completion tracking
- **Root** = Main system documentation
