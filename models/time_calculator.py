"""
Time Estimator Model
Estimates manufacturing time for jobs based on STL analysis, material, quantity, device type.
"""

import numpy as np
from typing import Dict, Optional
from dataclasses import dataclass


@dataclass
class TimeEstimateInput:
    """Input for time estimation"""
    stl_file_path: Optional[str] = None
    stl_volume_cm3: Optional[float] = None  # Part volume in cubic centimeters
    stl_surface_area_cm2: Optional[float] = None
    stl_complexity_score: Optional[float] = None  # 0-1
    
    material: str
    quantity: int
    device_type: str  # e.g., '3d_printer_fdm', 'cnc_mill'
    tolerance_tier: str  # 'low', 'medium', 'high'
    
    # Device-specific parameters
    print_speed_mm_per_sec: Optional[float] = None  # For 3D printing
    layer_height_mm: Optional[float] = None  # For 3D printing
    infill_percentage: Optional[float] = 20.0  # For 3D printing


@dataclass
class TimeEstimateOutput:
    """Output from time estimation"""
    estimated_hours: float
    setup_time_hours: float
    per_unit_hours: float
    total_hours: float  # setup + (per_unit * quantity)
    breakdown: Dict[str, float]  # Time breakdown by operation


class TimeCalculator:
    """
    Time Estimator Model
    
    Architecture:
    - Rule-based calculator with device-specific formulas
    - Can be enhanced with ML regression model trained on historical data
    
    Formulas by Device Type:
    
    1. **3D Printer (FDM):**
       ```
       layers = part_height_mm / layer_height_mm
       time_per_layer = (travel_distance + print_distance) / print_speed
       print_time = layers * time_per_layer
       setup_time = 0.5 hours (bed leveling, material loading)
       ```
    
    2. **CNC Mill:**
       ```
       time = (material_volume / material_removal_rate) * complexity_factor
       setup_time = 1.0 hours (fixturing, tool setup)
       ```
    
    3. **Laser Cutter:**
       ```
       time = (cutting_length / cutting_speed) * passes
       setup_time = 0.25 hours (material placement, focus)
       ```
    
    4. **Injection Molding:**
       ```
       time = cycle_time_seconds / 3600 * quantity
       setup_time = 2.0 hours (mold setup, material prep)
       ```
    
    For now, uses heuristics. Can train ML model (e.g., Random Forest) on historical
    job data to predict actual time vs. estimated time.
    """
    
    def __init__(self):
        # Device-specific parameters (defaults)
        self.device_speeds = {
            '3d_printer_fdm': {'print_speed': 60.0, 'layer_height': 0.2},  # mm/s, mm
            '3d_printer_resin': {'print_speed': 2.0, 'layer_height': 0.05},
            'cnc_mill': {'removal_rate': 10.0},  # cm³/min
            'cnc_router': {'cutting_speed': 3000.0},  # mm/min
            'laser_co2': {'cutting_speed': 500.0},  # mm/min
            'injection_molding': {'cycle_time': 30.0},  # seconds
        }
    
    def estimate(self, input_data: TimeEstimateInput) -> TimeEstimateOutput:
        """
        Estimate manufacturing time
        
        Args:
            input_data: Time estimation inputs
        
        Returns:
            TimeEstimateOutput with hours breakdown
        """
        device_type = input_data.device_type
        
        # Setup time (device-specific)
        setup_times = {
            '3d_printer_fdm': 0.5,
            '3d_printer_resin': 0.5,
            'cnc_mill': 1.0,
            'cnc_router': 0.75,
            'cnc_lathe': 1.0,
            'laser_co2': 0.25,
            'laser_fiber': 0.5,
            'injection_molding': 2.0,
        }
        setup_time = setup_times.get(device_type, 0.5)
        
        # Per-unit time calculation
        if '3d_printer' in device_type:
            per_unit = self._estimate_3d_print_time(input_data)
        elif 'cnc' in device_type:
            per_unit = self._estimate_cnc_time(input_data)
        elif 'laser' in device_type:
            per_unit = self._estimate_laser_time(input_data)
        elif 'injection_molding' in device_type:
            per_unit = self._estimate_injection_time(input_data)
        else:
            # Generic heuristic: 1-4 hours per unit based on complexity
            complexity = input_data.stl_complexity_score or 0.5
            per_unit = 1.0 + (complexity * 3.0)
        
        # Apply tolerance multiplier (higher tolerance = more time)
        tolerance_multipliers = {'low': 1.0, 'medium': 1.2, 'high': 1.5}
        per_unit *= tolerance_multipliers.get(input_data.tolerance_tier, 1.2)
        
        # Total time
        total_hours = setup_time + (per_unit * input_data.quantity)
        
        breakdown = {
            'setup_time': setup_time,
            'per_unit_time': per_unit,
            'production_time': per_unit * input_data.quantity,
            'tolerance_multiplier': tolerance_multipliers.get(input_data.tolerance_tier, 1.2),
        }
        
        return TimeEstimateOutput(
            estimated_hours=per_unit,
            setup_time_hours=setup_time,
            per_unit_hours=per_unit,
            total_hours=total_hours,
            breakdown=breakdown
        )
    
    def _estimate_3d_print_time(self, input_data: TimeEstimateInput) -> float:
        """Estimate 3D printing time"""
        # Heuristic: 0.1-2 hours per unit based on volume
        volume = input_data.stl_volume_cm3 or 100.0  # Default 100 cm³
        complexity = input_data.stl_complexity_score or 0.5
        
        # Base time: 0.05 hours per 10 cm³
        base_time = (volume / 10.0) * 0.05
        
        # Complexity adjustment
        base_time *= (1.0 + complexity)
        
        return max(0.1, min(2.0, base_time))  # Clamp to 0.1-2 hours
    
    def _estimate_cnc_time(self, input_data: TimeEstimateInput) -> float:
        """Estimate CNC machining time"""
        volume = input_data.stl_volume_cm3 or 100.0
        removal_rate = 10.0  # cm³/min
        
        # Time to remove material
        time_minutes = (volume / removal_rate) * input_data.stl_complexity_score if input_data.stl_complexity_score else (volume / removal_rate)
        time_hours = time_minutes / 60.0
        
        return max(0.5, time_hours)
    
    def _estimate_laser_time(self, input_data: TimeEstimateInput) -> float:
        """Estimate laser cutting time"""
        # Heuristic: 0.05-0.5 hours per unit
        complexity = input_data.stl_complexity_score or 0.5
        return 0.05 + (complexity * 0.45)
    
    def _estimate_injection_time(self, input_data: TimeEstimateInput) -> float:
        """Estimate injection molding time"""
        cycle_time_sec = 30.0  # Default 30 seconds per cycle
        return cycle_time_sec / 3600.0  # Convert to hours

