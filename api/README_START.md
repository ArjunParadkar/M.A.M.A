# 🚀 Starting the FastAPI Server

## Quick Start:

```bash
cd /home/god/Desktop/M.A.M.A/api
./start.sh
```

**OR manually:**

```bash
cd /home/god/Desktop/M.A.M.A/api
source venv/bin/activate
python main.py
```

---

## ✅ What You Should See:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

---

## 🧪 Test It Works:

**In another terminal:**

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

Should return JSON with pricing breakdown.

---

## ⚠️ Important:

- **Keep this terminal open** - server needs to keep running
- **Don't close the terminal** - that will stop the server
- If you need to stop: Press `Ctrl+C`

---

## 🔧 Troubleshooting:

**If port 8000 is already in use:**
- Change port in `main.py`: `uvicorn.run(app, host="0.0.0.0", port=8001)`
- Or kill the process using port 8000

**If you see import errors:**
- Make sure you activated venv: `source venv/bin/activate`
- Reinstall: `pip install -r requirements.txt`

