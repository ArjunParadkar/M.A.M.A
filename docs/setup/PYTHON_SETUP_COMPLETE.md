# ✅ Python Setup - Quick Guide

## What I Did:

1. Created Python virtual environment in `api/venv/`
2. Installed all dependencies
3. Created startup scripts

---

## 🚀 How to Start FastAPI Server:

### Option 1: Use the start script (Easiest)
```bash
cd /home/god/Desktop/M.A.M.A/api
./start.sh
```

### Option 2: Manual activation
```bash
cd /home/god/Desktop/M.A.M.A/api
source venv/bin/activate
python main.py
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

## ✅ Verification:

1. **Check server is running:**
   - Open: http://localhost:8000
   - Should see: `{"message": "M.A.M.A AI Models API"}`

2. **Test F2 endpoint:**
```bash
curl -X POST "http://localhost:8000/api/ai/pay" \
  -H "Content-Type: application/json" \
  -d '{"material": "6061-T6 Aluminum", "quantity": 50, "estimated_hours": 12}'
```

---

## 📝 Notes:

- **Virtual environment is in:** `api/venv/`
- **Always activate venv before running:** `source venv/bin/activate`
- **Or use:** `./start.sh` (automatically activates)
- **Keep this terminal open** - server needs to keep running

---

## 🔧 If You Need to Reinstall:

```bash
cd /home/god/Desktop/M.A.M.A/api
rm -rf venv
./setup.sh
```

---

**Once server is running, tell me and we'll test the full integration!** 🚀

