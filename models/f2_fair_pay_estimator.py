"""
F2: Fair Pay Estimator Model
Calculates fair compensation for manufacturing jobs based on materials, time, complexity, urgency.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import os


@dataclass
class PayEstimateInput:
    """Input features for pay estimation"""
    # Job specs (required fields first)
    material: str  # e.g., 'PLA', 'ABS', 'Metal', 'Wood'
    material_cost_per_unit: float  # cost in USD
    quantity: int
    tolerance_tier: str  # 'low', 'medium', 'high'
    complexity_score: float  # 0-1, estimated from STL analysis or user input
    estimated_hours: float  # estimated manufacturing time
    deadline_days: int
    
    # Optional fields with defaults (must come after required fields)
    setup_time_hours: float = 1.0
    standard_delivery_days: int = 14  # typical delivery time
    shipping_distance_miles: float = 0.0
    market_rate_per_hour: float = 35.0  # average manufacturing labor rate


@dataclass
class PayEstimateOutput:
    """Output from pay estimation model"""
    suggested_pay: float  # Recommended pay in USD
    range_low: float  # Lower bound (suggested_pay * 0.85)
    range_high: float  # Upper bound (suggested_pay * 1.15)
    breakdown: Dict[str, float]  # Cost breakdown (materials, labor, overhead, margin)
    model_version: str = "v1.0"


class FairPayEstimatorModel:
    """
    F2: Fair Pay Estimator Model
    
    Architecture:
    - Gradient Boosting Regressor for main pay prediction
    - Multi-component breakdown: Materials + Labor + Overhead + Margin
    - Feature engineering: Material costs, time complexity, urgency multipliers
    
    Formula Approach:
    suggested_pay = (material_cost + labor_cost + overhead) * (1 + margin) * urgency_multiplier
    
    Where:
    - material_cost = material_cost_per_unit * quantity
    - labor_cost = estimated_hours * hourly_rate * complexity_multiplier
    - overhead = labor_cost * 0.15 (15% overhead)
    - margin = 0.20 (20% margin for maker profit)
    - urgency_multiplier = 1.0 if deadline > standard_delivery, else scales up to 1.5
    
    The model learns to refine these base calculations using historical job data.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.material_encoder = LabelEncoder()
        self.model = GradientBoostingRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.05,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Material cost lookup (can be replaced with database query)
        self.material_cost_lookup = {
            'PLA': 0.02, 'ABS': 0.025, 'PETG': 0.03, 'TPU': 0.05,
            'Nylon': 0.04, 'Metal': 0.15, 'Wood': 0.03, 'Acrylic': 0.04,
            'Resin': 0.08, 'Carbon Fiber': 0.12
        }
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def _calculate_urgency_multiplier(self, deadline_days: int, standard_days: int) -> float:
        """Calculate urgency multiplier (1.0 to 1.5)"""
        if deadline_days >= standard_days:
            return 1.0
        elif deadline_days >= standard_days * 0.7:
            return 1.1
        elif deadline_days >= standard_days * 0.5:
            return 1.2
        elif deadline_days >= standard_days * 0.3:
            return 1.3
        else:
            return 1.5  # Rush job
    
    def _calculate_complexity_multiplier(self, tolerance_tier: str, complexity_score: float) -> float:
        """Calculate labor complexity multiplier"""
        tier_multipliers = {'low': 1.0, 'medium': 1.25, 'high': 1.5}
        tier_factor = tier_multipliers.get(tolerance_tier, 1.25)
        complexity_factor = 1.0 + (complexity_score * 0.3)  # 1.0 to 1.3
        return tier_factor * complexity_factor
    
    def _extract_features(self, input_data: PayEstimateInput) -> np.ndarray:
        """Extract features for ML model"""
        material_encoded = 0  # Placeholder - would use encoder
        
        urgency_mult = self._calculate_urgency_multiplier(
            input_data.deadline_days, 
            input_data.standard_delivery_days
        )
        complexity_mult = self._calculate_complexity_multiplier(
            input_data.tolerance_tier,
            input_data.complexity_score
        )
        
        features = np.array([[
            input_data.material_cost_per_unit,
            input_data.quantity,
            input_data.estimated_hours,
            input_data.setup_time_hours,
            urgency_mult,
            complexity_mult,
            input_data.complexity_score,
            input_data.deadline_days / input_data.standard_delivery_days,  # deadline ratio
            material_encoded,
        ]])
        
        return features
    
    def _calculate_heuristic_pay(self, input_data: PayEstimateInput) -> Tuple[float, Dict[str, float]]:
        """Calculate pay using heuristic formula"""
        # Material cost
        material_cost = input_data.material_cost_per_unit * input_data.quantity
        
        # Labor cost
        total_hours = input_data.estimated_hours + input_data.setup_time_hours
        complexity_mult = self._calculate_complexity_multiplier(
            input_data.tolerance_tier,
            input_data.complexity_score
        )
        labor_cost = total_hours * input_data.market_rate_per_hour * complexity_mult
        
        # Overhead (15% of labor)
        overhead = labor_cost * 0.15
        
        # Subtotal
        subtotal = material_cost + labor_cost + overhead
        
        # Margin (20% for maker profit)
        margin = subtotal * 0.20
        
        # Urgency multiplier
        urgency_mult = self._calculate_urgency_multiplier(
            input_data.deadline_days,
            input_data.standard_delivery_days
        )
        
        # Final suggested pay
        suggested_pay = (subtotal + margin) * urgency_mult
        
        breakdown = {
            'materials': round(material_cost, 2),
            'labor': round(labor_cost, 2),
            'overhead': round(overhead, 2),
            'margin': round(margin, 2),
            'urgency_multiplier': round(urgency_mult, 2),
            'base_subtotal': round(subtotal, 2),
        }
        
        return suggested_pay, breakdown
    
    def estimate(self, input_data: PayEstimateInput) -> PayEstimateOutput:
        """
        Estimate fair pay for a job
        
        Args:
            input_data: Job specifications and requirements
        
        Returns:
            PayEstimateOutput with suggested pay, range, and breakdown
        """
        # Calculate base pay using heuristic
        suggested_pay, breakdown = self._calculate_heuristic_pay(input_data)
        
        # If model is trained, refine the estimate
        if self.is_trained:
            features = self._extract_features(input_data)
            features_scaled = self.scaler.transform(features)
            model_prediction = float(self.model.predict(features_scaled)[0])
            
            # Blend heuristic and model (70% model, 30% heuristic as fallback)
            suggested_pay = (model_prediction * 0.7) + (suggested_pay * 0.3)
        
        # Calculate range (±15%)
        range_low = suggested_pay * 0.85
        range_high = suggested_pay * 1.15
        
        # Update breakdown with final pay
        breakdown['final_suggested_pay'] = round(suggested_pay, 2)
        
        return PayEstimateOutput(
            suggested_pay=round(suggested_pay, 2),
            range_low=round(range_low, 2),
            range_high=round(range_high, 2),
            breakdown=breakdown,
            model_version="v1.0"
        )
    
    def train(self, X: np.ndarray, y: np.ndarray):
        """Train the model on historical job pay data"""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
    
    def save_model(self, model_path: str):
        """Save trained model"""
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'material_encoder': self.material_encoder,
            'is_trained': self.is_trained,
        }, model_path)
    
    def load_model(self, model_path: str):
        """Load trained model"""
        data = joblib.load(model_path)
        self.model = data['model']
        self.scaler = data['scaler']
        self.material_encoder = data.get('material_encoder', LabelEncoder())
        self.is_trained = data['is_trained']

