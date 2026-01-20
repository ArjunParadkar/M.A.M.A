"""
F2: Fair Pay Estimator API Route
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys
import os

# Add models directory to path
models_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
if models_path not in sys.path:
    sys.path.insert(0, models_path)

try:
    from f2_fair_pay_estimator import FairPayEstimatorModel, PayEstimateInput
    F2_MODEL_AVAILABLE = True
except ImportError as e:
    # Fallback if model not available
    print(f"Warning: F2 model not available: {e}")
    FairPayEstimatorModel = None
    F2_MODEL_AVAILABLE = False

router = APIRouter()

class PayEstimateRequest(BaseModel):
    material: str
    quantity: int
    tolerance_tier: Optional[str] = "medium"
    complexity_score: Optional[float] = 0.5
    estimated_hours: float
    setup_hours: Optional[float] = 1.0
    deadline_days: Optional[int] = 14
    standard_delivery_days: Optional[int] = 14
    market_rate_per_hour: Optional[float] = 45.0

@router.post("/")
async def estimate_pay(request: PayEstimateRequest):
    """
    Estimate fair pay for a manufacturing job using F2 model
    """
    try:
        if FairPayEstimatorModel is None:
            # Fallback calculation (matches frontend logic)
            return await _fallback_pay_estimate(request)
        
        # Initialize model
        model = FairPayEstimatorModel()
        
        # Build input
        input_data = PayEstimateInput(
            material=request.material,
            material_cost_per_unit=_get_material_cost(request.material),
            quantity=request.quantity,
            tolerance_tier=request.tolerance_tier,
            complexity_score=request.complexity_score,
            estimated_hours=request.estimated_hours,
            setup_time_hours=request.setup_hours,
            deadline_days=request.deadline_days,
            standard_delivery_days=request.standard_delivery_days,
            market_rate_per_hour=request.market_rate_per_hour
        )
        
        # Get estimate
        result = model.estimate(input_data)
        
        return {
            "suggested_pay": result.suggested_pay,
            "range_low": result.range_low,
            "range_high": result.range_high,
            "breakdown": result.breakdown,
            "model_version": result.model_version
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error estimating pay: {str(e)}")

async def _fallback_pay_estimate(request: PayEstimateRequest):
    """Fallback calculation matching frontend logic"""
    material_cost_per_unit = _get_material_cost(request.material)
    material_cost = material_cost_per_unit * request.quantity
    
    # Complexity multiplier
    complexity_mult = 1.2 if request.tolerance_tier == "high" else 1.0
    
    # Labor cost
    total_hours = request.estimated_hours + request.setup_hours
    labor_cost = total_hours * request.market_rate_per_hour * complexity_mult
    
    # Overhead (15%)
    overhead = labor_cost * 0.15
    
    # Subtotal
    subtotal = material_cost + labor_cost + overhead
    
    # Margin (20%)
    margin = subtotal * 0.20
    
    # Urgency multiplier
    urgency_mult = 1.1 if request.deadline_days < request.standard_delivery_days else 1.0
    
    # Final
    suggested_pay = (subtotal + margin) * urgency_mult
    
    return {
        "suggested_pay": round(suggested_pay, 2),
        "range_low": round(suggested_pay * 0.85, 2),
        "range_high": round(suggested_pay * 1.15, 2),
        "breakdown": {
            "materials": round(material_cost, 2),
            "labor": round(labor_cost, 2),
            "overhead": round(overhead, 2),
            "margin": round(margin, 2),
            "urgency_multiplier": round(urgency_mult, 2),
            "base_subtotal": round(subtotal, 2)
        },
        "model_version": "fallback-v1.0"
    }

def _get_material_cost(material: str) -> float:
    """Get material cost per unit"""
    costs = {
        # Metals
        '6061-T6 Aluminum': 4.90,
        '7075 Aluminum': 6.50,
        '304 Stainless Steel': 5.80,
        '316 Stainless Steel': 7.20,
        'Mild Steel (A36)': 3.50,
        'Carbon Steel': 4.20,
        'Titanium (Grade 5)': 45.00,
        'Brass': 8.50,
        'Copper': 6.80,
        'Bronze': 9.20,
        # Plastics
        'ABS': 0.08,
        'PLA': 0.06,
        'PETG': 0.09,
        'Nylon': 0.12,
        'Polycarbonate': 0.15,
        'Delrin (Acetal)': 0.18,
        'HDPE': 0.10,
        'UHMW': 0.14,
        'Acrylic': 0.11,
        'Polypropylene': 0.09,
        'PEEK': 0.85,
        'Ultem': 1.20,
        # Other
        'Wood': 0.15,
        'Ceramic': 0.25,
        'Composite': 0.45,
        'Rubber': 0.20,
        'Glass': 0.35,
    }
    return costs.get(material, 0.10)  # Default fallback

