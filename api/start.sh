#!/bin/bash
# Start FastAPI server

cd "$(dirname "$0")"
source venv/bin/activate

# Use uvicorn command for better reload support
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

