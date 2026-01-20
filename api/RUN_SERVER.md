# 🚀 How to Run FastAPI Server

## Option 1: Use the start script (Recommended)

```bash
cd /home/god/Desktop/M.A.M.A/api
./start.sh
```

This uses `uvicorn` command directly (no warning).

---

## Option 2: Use uvicorn command directly

```bash
cd /home/god/Desktop/M.A.M.A/api
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**This is the recommended way** - no warnings, auto-reload on code changes.

---

## Option 3: Python main.py (Current way - has warning but works)

```bash
cd /home/god/Desktop/M.A.M.A/api
source venv/bin/activate
python main.py
```

**The warning is harmless** - server still works! But Option 1 or 2 is better.

---

## ✅ What You Should See:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx]
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🧪 Test It:

**In browser or another terminal:**

```bash
curl http://localhost:8000/
```

Should return: `{"message": "M.A.M.A AI Models API", ...}`

**Test F2 Pay Estimator:**

```bash
curl -X POST "http://localhost:8000/api/ai/pay" \
  -H "Content-Type: application/json" \
  -d '{"material": "6061-T6 Aluminum", "quantity": 50, "estimated_hours": 12}'
```

---

**The warning you saw is just informational - the server still works! But use `./start.sh` for a cleaner experience.** ✅

