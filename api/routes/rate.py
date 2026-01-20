"""
Manufacturer Rating Aggregator API Route
Calculates and aggregates ratings for manufacturers using Bayesian averaging
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import sys
import os

# Add models directory to path
models_path = os.path.join(os.path.dirname(__file__), '..', '..', 'models')
if models_path not in sys.path:
    sys.path.insert(0, models_path)

try:
    from business_logic import RatingAggregator
    RATING_AGGREGATOR_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Rating aggregator not available: {e}")
    RatingAggregator = None
    RATING_AGGREGATOR_AVAILABLE = False

router = APIRouter()

class RatingData(BaseModel):
    """Individual rating data"""
    rating: float  # 1-5
    comment: Optional[str] = None
    job_id: str
    rated_at: str  # ISO format datetime

class RateRequest(BaseModel):
    """Request for rating aggregation"""
    manufacturer_id: str
    ratings: List[RatingData]
    total_jobs_completed: int = 0
    total_ratings_received: int = 0

@router.post("/")
async def aggregate_ratings(request: RateRequest):
    """
    Aggregate and calculate manufacturer ratings using Bayesian averaging
    """
    try:
        if not RATING_AGGREGATOR_AVAILABLE or RatingAggregator is None:
            # Fallback: Simple average
            return await _fallback_rating(request)
        
        # Initialize aggregator
        aggregator = RatingAggregator()
        
        # Convert ratings to dict format
        ratings_list = []
        for rating_data in request.ratings:
            ratings_list.append({
                'rating': rating_data.rating,
                'comment': rating_data.comment,
                'job_id': rating_data.job_id,
                'rated_at': rating_data.rated_at,
            })
        
        # Aggregate ratings (returns dict, not dataclass)
        result = RatingAggregator.aggregate_ratings(ratings_list)
        
        # Calculate Bayesian rating
        bayesian_rating = RatingAggregator.calculate_bayesian_rating(ratings_list)
        
        # Calculate confidence (based on number of ratings)
        confidence = min(1.0, len(ratings_list) / 10.0) if ratings_list else 0.0
        
        return {
            'manufacturer_id': request.manufacturer_id,
            'average_rating': round(result.get('average_rating', 0.0), 2),
            'bayesian_rating': round(bayesian_rating, 2),
            'total_ratings': result.get('total_ratings', 0),
            'rating_distribution': result.get('rating_distribution', {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}),
            'confidence': round(confidence, 2),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error aggregating ratings: {str(e)}")

async def _fallback_rating(request: RateRequest):
    """Fallback rating using simple average"""
    if not request.ratings:
        return {
            'manufacturer_id': request.manufacturer_id,
            'average_rating': 0.0,
            'bayesian_rating': 0.0,
            'total_ratings': 0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            'confidence': 0.0,
        }
    
    ratings = [r.rating for r in request.ratings]
    avg_rating = sum(ratings) / len(ratings)
    
    # Simple distribution
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings:
        star = int(round(rating))
        if 1 <= star <= 5:
            distribution[star] = distribution.get(star, 0) + 1
    
    # Confidence based on number of ratings
    confidence = min(1.0, len(ratings) / 10.0)
    
    return {
        'manufacturer_id': request.manufacturer_id,
        'average_rating': round(avg_rating, 2),
        'bayesian_rating': round(avg_rating, 2),  # Same as average for fallback
        'total_ratings': len(ratings),
        'rating_distribution': distribution,
        'confidence': round(confidence, 2),
    }
