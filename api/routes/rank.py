"""
F1: Maker Ranking/Matching API Route
Ranks manufacturers for a job using F1 model
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import sys
import os

# Add models directory to path
models_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
if models_path not in sys.path:
    sys.path.insert(0, models_path)

try:
    from f1_maker_ranking import MakerRankingModel, MakerRankingInput, MakerRankingOutput
    F1_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Warning: F1 model not available: {e}")
    MakerRankingModel = None
    F1_MODEL_AVAILABLE = False

router = APIRouter()

class ManufacturerData(BaseModel):
    """Manufacturer data from database"""
    manufacturer_id: str
    equipment_match_score: float
    materials_available: List[str]
    tolerance_capability: str
    average_rating: float
    total_jobs_completed: int
    total_ratings_received: int
    capacity_score: float
    quality_score: float
    location_state: str
    location_distance_miles: Optional[float] = None

class RankRequest(BaseModel):
    """Request for manufacturer ranking"""
    job_specs: Dict  # material, tolerance_tier, quantity, deadline_days, etc.
    manufacturers: List[ManufacturerData]  # List of manufacturers to rank

class RankResponse(BaseModel):
    """Ranked manufacturer response"""
    manufacturer_id: str
    rank_score: float
    explanations: Dict[str, float]
    estimated_completion_days: float
    capacity_score: float
    quality_score: float

@router.post("/")
async def rank_manufacturers(request: RankRequest):
    """
    Rank manufacturers for a job using F1 model
    """
    try:
        if not F1_MODEL_AVAILABLE or MakerRankingModel is None:
            # Fallback: Simple heuristic ranking
            return await _fallback_ranking(request)
        
        # Initialize model
        model = MakerRankingModel()
        
        # Extract job specs
        job_specs = request.job_specs
        material = job_specs.get('material', '')
        tolerance_tier = job_specs.get('tolerance_tier', 'medium')
        quantity = job_specs.get('quantity', 1)
        deadline_days = job_specs.get('deadline_days', 14)
        
        # Rank each manufacturer
        ranked_results = []
        for mfg in request.manufacturers:
            # Check material compatibility
            if material and material not in mfg.materials_available:
                continue  # Skip if material not available
            
            # Build ranking input
            ranking_input = MakerRankingInput(
                material=material,
                tolerance_tier=tolerance_tier,
                quantity=quantity,
                deadline_days=deadline_days,
                manufacturer_id=mfg.manufacturer_id,
                equipment_match_score=mfg.equipment_match_score,
                materials_available=mfg.materials_available,
                tolerance_capability=mfg.tolerance_capability,
                average_rating=mfg.average_rating,
                total_jobs_completed=mfg.total_jobs_completed,
                total_ratings_received=mfg.total_ratings_received,
                capacity_score=mfg.capacity_score,
                location_state=mfg.location_state,
                location_distance_miles=mfg.location_distance_miles
            )
            
            # Get ranking (F1 model uses predict method with job_tolerance)
            result = model.predict(ranking_input, tolerance_tier)
            
            ranked_results.append({
                'manufacturer_id': mfg.manufacturer_id,
                'rank_score': result.rank_score,
                'explanations': result.explanations,
                'estimated_completion_days': result.estimated_completion_days,
                'capacity_score': mfg.capacity_score,
                'quality_score': mfg.quality_score,
            })
        
        # Sort by rank_score (descending)
        ranked_results.sort(key=lambda x: x['rank_score'], reverse=True)
        
        # Return top matches
        return ranked_results[:10]  # Top 10
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ranking manufacturers: {str(e)}")

async def _fallback_ranking(request: RankRequest):
    """Fallback ranking using simple heuristics"""
    job_specs = request.job_specs
    material = job_specs.get('material', '')
    tolerance_tier = job_specs.get('tolerance_tier', 'medium')
    
    ranked = []
    for mfg in request.manufacturers:
        # Skip if material not available
        if material and material not in mfg.materials_available:
            continue
        
        # Simple scoring
        score = 0.0
        
        # Equipment match (30%)
        score += mfg.equipment_match_score * 0.3
        
        # Rating (25%)
        score += (mfg.average_rating / 5.0) * 0.25
        
        # Capacity (20%)
        score += mfg.capacity_score * 0.2
        
        # Quality (15%)
        score += mfg.quality_score * 0.15
        
        # Tolerance match (10%)
        if mfg.tolerance_capability == tolerance_tier:
            score += 0.1
        elif abs(ord(mfg.tolerance_capability[0]) - ord(tolerance_tier[0])) == 1:
            score += 0.05  # Adjacent tier
        
        # Normalize to 0-1
        score = min(1.0, max(0.0, score))
        
        # Estimate completion days (simple heuristic)
        base_days = 7
        if mfg.capacity_score > 0.8:
            base_days += 2  # High capacity = slightly longer (more jobs)
        if mfg.quality_score > 0.85:
            base_days += 1  # Higher quality = slightly longer (more careful)
        
        ranked.append({
            'manufacturer_id': mfg.manufacturer_id,
            'rank_score': score,
            'explanations': {
                'equipment_match': mfg.equipment_match_score,
                'reputation': mfg.average_rating / 5.0,
                'capacity': mfg.capacity_score
            },
            'estimated_completion_days': base_days,
            'capacity_score': mfg.capacity_score,
            'quality_score': mfg.quality_score,
        })
    
    # Sort by score
    ranked.sort(key=lambda x: x['rank_score'], reverse=True)
    return ranked[:10]
