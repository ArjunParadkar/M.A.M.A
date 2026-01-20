"""
F1: Maker Ranking Model
Recommends the best manufacturers for a given job based on equipment, history, location, etc.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import joblib
import os


@dataclass
class MakerRankingInput:
    """Input features for maker ranking"""
    # Job requirements
    material: str
    tolerance_tier: str  # 'low', 'medium', 'high'
    quantity: int
    deadline_days: int
    
    # Manufacturer features
    manufacturer_id: str
    equipment_match_score: float  # 0-1, based on device capabilities
    materials_available: List[str]
    tolerance_capability: str  # 'low', 'medium', 'high'
    average_rating: float  # 0-5
    total_jobs_completed: int
    total_ratings_received: int
    capacity_score: float  # 0-1
    location_state: str
    location_distance_miles: Optional[float] = None  # distance to job location if known


@dataclass
class MakerRankingOutput:
    """Output from maker ranking model"""
    manufacturer_id: str
    rank_score: float  # 0-1, higher is better
    explanations: Dict[str, float]  # Top 3 factors contributing to score
    estimated_completion_days: float
    confidence: float  # 0-1


class MakerRankingModel:
    """
    F1: Maker Ranking Model
    
    Architecture:
    - Hybrid approach: Gradient Boosting Regressor for main ranking score
    - Feature engineering: Equipment match, reputation, capacity, location
    - Post-processing: Normalize scores to 0-1 range with explanations
    
    Features:
    1. Equipment compatibility (one-hot encoded device types + materials)
    2. Historical performance (ratings, completion rate, on-time rate)
    3. Capacity and availability (capacity_score, current workload)
    4. Location and logistics (distance, shipping time estimate)
    5. Tolerance matching (tier alignment with job requirements)
    6. Material availability (boolean flags for required materials)
    
    The model uses a Gradient Boosting Regressor (XGBoost-style) to predict
    a composite "fit score" that considers all factors. The score is then
    normalized and sorted to rank manufacturers.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        # Demo-safe runtime: avoid scikit-learn dependency (Python 3.13 install issues).
        # We keep the public API identical and use the heuristic path unless a trained model is loaded.
        self.scaler = None
        self.model = None
        self.feature_names = [
            'equipment_match_score',
            'tolerance_match',  # 1.0 if tier matches, 0.5 if adjacent, 0.0 if far
            'average_rating_normalized',  # normalized 0-5 -> 0-1
            'completion_rate',  # total_jobs_completed / (total_jobs_completed + 1) to avoid div by zero
            'capacity_score',
            'material_match',  # fraction of required materials available
            'distance_factor',  # 1.0 if < 100 miles, 0.8 if < 500, 0.6 if < 1000, 0.4 otherwise
            'reputation_factor',  # log(total_ratings_received + 1) / 10, capped at 1.0
            'deadline_feasibility',  # 1.0 if capacity allows meeting deadline, else 0.5
        ]
        self.is_trained = False
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def _extract_features(self, input_data: MakerRankingInput, job_tolerance: str) -> np.ndarray:
        """Extract and engineer features from input"""
        # Tolerance match (1.0 = exact match, 0.5 = adjacent, 0.0 = mismatch)
        tolerance_order = {'low': 0, 'medium': 1, 'high': 2}
        mfg_tier = tolerance_order.get(input_data.tolerance_capability, 1)
        job_tier = tolerance_order.get(job_tolerance, 1)
        tolerance_match = 1.0 if mfg_tier == job_tier else (0.5 if abs(mfg_tier - job_tier) == 1 else 0.0)
        
        # Rating normalized
        rating_normalized = min(input_data.average_rating / 5.0, 1.0)
        
        # Completion rate (smooth with +1)
        completion_rate = min(input_data.total_jobs_completed / (input_data.total_jobs_completed + 10), 1.0)
        
        # Material match (simplified - in real model would check required materials)
        material_match = 1.0  # Placeholder - would check if job material in materials_available
        
        # Distance factor
        if input_data.location_distance_miles is None:
            distance_factor = 0.7  # Unknown distance, neutral
        elif input_data.location_distance_miles < 100:
            distance_factor = 1.0
        elif input_data.location_distance_miles < 500:
            distance_factor = 0.8
        elif input_data.location_distance_miles < 1000:
            distance_factor = 0.6
        else:
            distance_factor = 0.4
        
        # Reputation factor (log scale to prevent huge manufacturers from dominating)
        reputation_factor = min(np.log1p(input_data.total_ratings_received) / 5.0, 1.0)
        
        # Deadline feasibility (simplified - would use capacity and workload)
        deadline_feasibility = 1.0 if input_data.capacity_score > 0.5 else 0.5
        
        features = np.array([[
            input_data.equipment_match_score,
            tolerance_match,
            rating_normalized,
            completion_rate,
            input_data.capacity_score,
            material_match,
            distance_factor,
            reputation_factor,
            deadline_feasibility,
        ]])
        
        return features
    
    def _get_explanations(self, input_data: MakerRankingInput, features: np.ndarray, score: float) -> Dict[str, float]:
        """Generate human-readable explanations for the ranking"""
        explanations = {
            'equipment_match': float(features[0, 0]) * 0.3,  # 30% weight
            'reputation': float(features[0, 2]) * 0.25,  # 25% weight
            'capacity': float(features[0, 4]) * 0.2,  # 20% weight
            'location': float(features[0, 6]) * 0.15,  # 15% weight
            'tolerance_match': float(features[0, 1]) * 0.1,  # 10% weight
        }
        
        # Sort by contribution and return top 3
        sorted_explanations = sorted(explanations.items(), key=lambda x: x[1], reverse=True)[:3]
        return dict(sorted_explanations)
    
    def predict(self, input_data: MakerRankingInput, job_tolerance: str) -> MakerRankingOutput:
        """
        Predict ranking score for a manufacturer-job pair
        
        Args:
            input_data: Manufacturer and job features
            job_tolerance: Job tolerance requirement ('low', 'medium', 'high')
        
        Returns:
            MakerRankingOutput with rank_score, explanations, etc.
        """
        # Extract features
        features = self._extract_features(input_data, job_tolerance)
        
        # If model not trained, use heuristic fallback
        if not self.is_trained:
            # Simple weighted heuristic
            score = (
                input_data.equipment_match_score * 0.3 +
                min(input_data.average_rating / 5.0, 1.0) * 0.25 +
                input_data.capacity_score * 0.2 +
                0.8 * 0.15 +  # distance neutral
                1.0 * 0.1  # tolerance match (assumed)
            )
            score = max(0.0, min(1.0, score))  # clamp to [0, 1]
        else:
            # Scale features and predict
            # If a trained model is loaded, it must provide a predict() method.
            # In the demo environment, this is typically not used.
            score = float(self.model.predict(features)[0])
            score = max(0.0, min(1.0, score))  # clamp to [0, 1]
        
        # Get explanations
        explanations = self._get_explanations(input_data, features, score)
        
        # Estimate completion days (heuristic: based on quantity and capacity)
        estimated_days = max(1, int(input_data.quantity / (input_data.capacity_score * 10)))
        
        return MakerRankingOutput(
            manufacturer_id=input_data.manufacturer_id,
            rank_score=score,
            explanations=explanations,
            estimated_completion_days=estimated_days,
            confidence=0.85 if self.is_trained else 0.6
        )
    
    def rank_manufacturers(
        self, 
        job_requirements: Dict,
        manufacturers: List[Dict]
    ) -> List[MakerRankingOutput]:
        """
        Rank multiple manufacturers for a job
        
        Args:
            job_requirements: Job specs (material, tolerance_tier, quantity, deadline)
            manufacturers: List of manufacturer profiles from database
        
        Returns:
            Sorted list of MakerRankingOutput (best first)
        """
        inputs = []
        for mfg in manufacturers:
            input_data = MakerRankingInput(
                material=job_requirements.get('material', ''),
                tolerance_tier=job_requirements.get('tolerance_tier', 'medium'),
                quantity=job_requirements.get('quantity', 1),
                deadline_days=job_requirements.get('deadline_days', 30),
                manufacturer_id=mfg['id'],
                equipment_match_score=self._calculate_equipment_match(job_requirements, mfg),
                materials_available=mfg.get('materials', []),
                tolerance_capability=mfg.get('tolerance_tier', 'medium'),
                average_rating=mfg.get('average_rating', 0.0),
                total_jobs_completed=mfg.get('total_jobs_completed', 0),
                total_ratings_received=mfg.get('total_ratings_received', 0),
                capacity_score=mfg.get('capacity_score', 0.5),
                location_state=mfg.get('location_state', ''),
            )
            inputs.append(input_data)
        
        # Predict for all
        outputs = [
            self.predict(inp, job_requirements.get('tolerance_tier', 'medium'))
            for inp in inputs
        ]
        
        # Sort by rank_score descending
        outputs.sort(key=lambda x: x.rank_score, reverse=True)
        
        return outputs
    
    def _calculate_equipment_match(self, job_requirements: Dict, manufacturer: Dict) -> float:
        """
        Calculate how well manufacturer's equipment matches job requirements
        
        Returns:
            Score 0-1 indicating equipment compatibility
        """
        # Placeholder: In real implementation, would:
        # 1. Parse job requirements (material, tolerance, size, etc.)
        # 2. Check manufacturer's devices (from manufacturer_devices table)
        # 3. Match device capabilities to job requirements
        # 4. Return weighted compatibility score
        
        # For now, return heuristic based on tolerance tier match
        job_tier = job_requirements.get('tolerance_tier', 'medium')
        mfg_tier = manufacturer.get('tolerance_tier', 'medium')
        
        if job_tier == mfg_tier:
            return 0.95
        elif abs(['low', 'medium', 'high'].index(job_tier) - ['low', 'medium', 'high'].index(mfg_tier)) == 1:
            return 0.75
        else:
            return 0.5
    
    def train(self, X: np.ndarray, y: np.ndarray):
        """Train the model on historical data"""
        raise NotImplementedError("Training is not enabled in the demo runtime. Use Python 3.11/3.12 + scikit-learn.")
        self.is_trained = True
    
    def save_model(self, model_path: str):
        """Save trained model and scaler"""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'is_trained': self.is_trained,
        }, model_path)
    
    def load_model(self, model_path: str):
        """Load trained model and scaler"""
        data = joblib.load(model_path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.is_trained = data['is_trained']

