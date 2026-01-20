"""
FastAPI Server for M.A.M.A AI Models
Handles all AI model endpoints: F1-F4, rating, pricing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import sys
import os

# Add models directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

app = FastAPI(
    title="M.A.M.A AI Models API",
    description="AI endpoints for Maker Ranking, Pay Estimation, Quality Check, and Workflow Scheduling",
    version="1.0.0"
)

# CORS middleware - allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes (will be created)
try:
    from routes import pay, rank, qc, workflow, rate
    app.include_router(pay.router, prefix="/api/ai/pay", tags=["F2 - Pay Estimator"])
    app.include_router(rank.router, prefix="/api/ai/rank", tags=["F1 - Maker Ranking"])
    app.include_router(qc.router, prefix="/api/ai/qc", tags=["F3 - Quality Check"])
    app.include_router(workflow.router, prefix="/api/ai/workflow", tags=["F4 - Workflow"])
    app.include_router(rate.router, prefix="/api/ai/rate", tags=["Rating Aggregator"])
except ImportError as e:
    print(f"Warning: Some routes not yet implemented: {e}")

@app.get("/")
async def root():
    return {
        "message": "M.A.M.A AI Models API",
        "version": "1.0.0",
        "endpoints": {
            "pay": "/api/ai/pay",
            "rank": "/api/ai/rank",
            "qc": "/api/ai/qc",
            "workflow": "/api/ai/workflow",
            "rate": "/api/ai/rate"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    # Use reload=False when running directly, or use: uvicorn main:app --reload
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)

