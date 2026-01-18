# M.A.M.A AI Models

This directory contains all AI/ML models and business logic calculators for the M.A.M.A platform.

## Models Overview

| Model | File | Type | Complexity |
|-------|------|------|------------|
| **F1: Maker Ranking** | `f1_maker_ranking.py` | Gradient Boosting | Medium |
| **F2: Fair Pay Estimator** | `f2_fair_pay_estimator.py` | Formula + GB Regressor | Low-Medium |
| **F3: Vision Quality Check** | `f3_vision_quality_check.py` | CLIP + Anomaly Detection | High |
| **F4: Workflow Scheduling** | `f4_workflow_scheduling.py` | CSP/Greedy Algorithm | Medium |
| **Business Logic** | `business_logic.py` | Rule-based | Low |

## Quick Start

```python
# Example: F1 Maker Ranking
from models.f1_maker_ranking import MakerRankingModel, MakerRankingInput

model = MakerRankingModel()
input_data = MakerRankingInput(
    material="PLA",
    tolerance_tier="medium",
    quantity=50,
    deadline_days=14,
    manufacturer_id="mfg_123",
    equipment_match_score=0.9,
    materials_available=["PLA", "ABS"],
    tolerance_capability="medium",
    average_rating=4.5,
    total_jobs_completed=100,
    total_ratings_received=85,
    capacity_score=0.8,
    location_state="CA"
)

output = model.predict(input_data, job_tolerance="medium")
print(f"Rank Score: {output.rank_score:.2f}")
print(f"Explanations: {output.explanations}")
```

## Installation

```bash
pip install -r requirements.txt
```

**Note:** Vision models (F3) require additional dependencies. Uncomment in `requirements.txt`:
- `torch`, `torchvision` for PyTorch
- `transformers` for CLIP
- `trimesh` for STL processing

## Model Status

- **F1, F2, F4, Business Logic:** ✅ Ready (heuristic implementations)
- **F3:** 🚧 Framework ready, requires ML dependencies for full implementation

See `MODEL_ARCHITECTURES.md` for detailed architecture descriptions.

## API Integration

These models are called from Next.js API routes:
- `/api/ai/rank` → `f1_maker_ranking.py`
- `/api/ai/pay` → `f2_fair_pay_estimator.py`
- `/api/ai/qc` → `f3_vision_quality_check.py`
- `/api/ai/schedule` → `f4_workflow_scheduling.py`

## Training

Models can be trained on historical data once collected. See individual model files for `train()` methods.

