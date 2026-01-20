# M.A.M.A AI Models API Server

FastAPI server for running AI models (F1-F4, rating, pricing).

## Setup

1. **Install Python dependencies:**
```bash
cd api
pip install -r requirements.txt
```

2. **Install FastAPI and Uvicorn:**
```bash
pip install fastapi uvicorn[standard]
```

3. **Run the server:**
```bash
python main.py
# OR
uvicorn main:app --reload --port 8000
```

4. **Test the server:**
- Open: http://localhost:8000
- Should see: `{"message": "M.A.M.A AI Models API", ...}`
- API docs: http://localhost:8000/docs

## Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `POST /api/ai/pay` - F2 Fair Pay Estimator
- `POST /api/ai/rank` - F1 Maker Ranking (coming soon)
- `POST /api/ai/qc` - F3 Quality Check (coming soon)
- `POST /api/ai/workflow` - F4 Workflow Scheduling (coming soon)
- `POST /api/ai/rate` - Rating Aggregator (coming soon)

## Testing F2 Pay Estimator

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

## Notes

- Server runs on port 8000 by default
- CORS enabled for `http://localhost:3000` (Next.js dev server)
- Model routes will be added incrementally
- If Python models can't be imported, fallback calculations are used

