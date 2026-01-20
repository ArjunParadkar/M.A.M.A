# Section 2: F2 Pay Estimator Integration - Instructions

## ✅ What I've Done:

1. **Created Next.js API route** (`apps/web/app/api/ai/pay/route.ts`)
   - Calls FastAPI server at `http://localhost:8000/api/ai/pay`
   - Handles errors gracefully with fallback

2. **Updated processing page** to call API
   - Now calls `/api/ai/pay` instead of only using frontend calculator
   - Falls back to frontend calculator if API fails

3. **Updated STL upload** to actually save files
   - Uses `uploadSTLFile()` helper function
   - Saves file URL to sessionStorage
   - Uploads to Supabase Storage `stl-files` bucket

---

## 🚨 WHAT YOU NEED TO DO:

### Step 1: Install Python Dependencies & Start FastAPI Server

**Open a NEW terminal window** (keep Next.js dev server running in the other one):

```bash
cd /home/god/Desktop/M.A.M.A/api
pip install -r requirements.txt
python main.py
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Keep this terminal open!** The FastAPI server needs to keep running.

### Step 2: Test the Connection

**In your browser:**
1. Make sure Next.js dev server is running (http://localhost:3000)
2. Make sure FastAPI server is running (http://localhost:8000)
3. Go to: http://localhost:3000/client/new-order?type=open-request
4. Fill out the form and upload an STL file
5. Click "Upload & Process"
6. On the processing page, check the browser console (F12)
7. You should see the API call being made

**Test FastAPI directly:**
```bash
curl -X POST "http://localhost:8000/api/ai/pay" \
  -H "Content-Type: application/json" \
  -d '{
    "material": "6061-T6 Aluminum",
    "quantity": 50,
    "estimated_hours": 12,
    "tolerance_tier": "high"
  }'
```

Should return JSON with pricing.

---

## ✅ Verification Checklist:

- [ ] FastAPI server running on port 8000
- [ ] Can access http://localhost:8000 and see API info
- [ ] Can test F2 endpoint with curl (returns pricing)
- [ ] Next.js can call `/api/ai/pay` successfully
- [ ] Processing page shows real pricing from API
- [ ] STL files upload to Supabase Storage

---

## 🔧 Troubleshooting:

**If FastAPI won't start:**
- Make sure Python 3.8+ is installed: `python3 --version`
- Install dependencies: `pip install fastapi uvicorn`
- Check for errors in terminal

**If API call fails:**
- Check FastAPI server is running
- Check browser console for errors
- The code will fallback to frontend calculator if API fails

**If STL upload fails:**
- Check Supabase Storage buckets exist
- Check RLS policies are set correctly
- Check user is authenticated

---

## 📋 Next Steps (After This Works):

Once F2 is working, we'll move to:
- **Section 3:** F1 Maker Ranking (fetch real manufacturers, apply ranking)
- **Section 4:** F3 Quality Check (implement CLIP comparison)
- **Section 5:** Database integration (save orders, accept jobs)

**Let me know when FastAPI is running and we'll test it!** 🚀

