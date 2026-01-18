"""
Business Logic Models (Non-ML)
Simple calculators and recommenders for earnings, next projects, ratings, etc.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import statistics


@dataclass
class ProjectEarnings:
    """Earnings calculation for a project or time period"""
    total_earnings: float
    earnings_by_job: List[Dict[str, float]]  # [{job_id, pay, materials_cost, net_earnings}]
    total_material_costs: float
    net_earnings: float
    period_start: datetime
    period_end: datetime


class EarningsCalculator:
    """
    Project Earnings Calculator
    
    Simple aggregation: Sum pay amounts from completed jobs minus material costs.
    No ML needed - just database queries and arithmetic.
    """
    
    @staticmethod
    def calculate_earnings(
        completed_jobs: List[Dict],
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None
    ) -> ProjectEarnings:
        """
        Calculate earnings from completed jobs
        
        Args:
            completed_jobs: List of job records with pay_amount, material_cost, etc.
            period_start: Optional start of period
            period_end: Optional end of period
        
        Returns:
            ProjectEarnings breakdown
        """
        total_earnings = 0.0
        total_material_costs = 0.0
        earnings_by_job = []
        
        for job in completed_jobs:
            pay = job.get('pay_amount', 0.0) or 0.0
            material_cost = job.get('material_cost', 0.0) or 0.0
            net = pay - material_cost
            
            total_earnings += pay
            total_material_costs += material_cost
            
            earnings_by_job.append({
                'job_id': job.get('id', ''),
                'pay': pay,
                'materials_cost': material_cost,
                'net_earnings': net,
            })
        
        return ProjectEarnings(
            total_earnings=total_earnings,
            earnings_by_job=earnings_by_job,
            total_material_costs=total_material_costs,
            net_earnings=total_earnings - total_material_costs,
            period_start=period_start or datetime.now() - timedelta(days=30),
            period_end=period_end or datetime.now()
        )


class NextProjectRecommender:
    """
    Next Project Recommender for Manufacturers
    
    Simple rule-based recommender (can be upgraded to ML later):
    - Recommends jobs that match manufacturer's capabilities
    - Prioritizes high-paying jobs
    - Considers device availability
    - Filters by materials and tolerance tier
    """
    
    @staticmethod
    def recommend_projects(
        available_jobs: List[Dict],
        manufacturer_profile: Dict,
        current_workload: int = 0,
        max_recommendations: int = 10
    ) -> List[Dict]:
        """
        Recommend next projects for a manufacturer
        
        Args:
            available_jobs: List of open job postings
            manufacturer_profile: Manufacturer's profile (devices, materials, tolerance_tier)
            current_workload: Number of active jobs
            max_recommendations: Max number of recommendations
        
        Returns:
            Sorted list of recommended jobs with recommendation scores
        """
        recommendations = []
        
        mfg_materials = set(manufacturer_profile.get('materials', []))
        mfg_tolerance = manufacturer_profile.get('tolerance_tier', 'medium')
        mfg_devices = manufacturer_profile.get('device_types', [])
        
        for job in available_jobs:
            score = 0.0
            reasons = []
            
            # Material match (40% weight)
            job_material = job.get('material', '')
            if job_material in mfg_materials:
                score += 0.4
                reasons.append('Material match')
            
            # Tolerance match (30% weight)
            job_tolerance = job.get('tolerance_tier', 'medium')
            if job_tolerance == mfg_tolerance:
                score += 0.3
                reasons.append('Tolerance match')
            elif abs(['low', 'medium', 'high'].index(job_tolerance) - 
                     ['low', 'medium', 'high'].index(mfg_tolerance)) == 1:
                score += 0.15  # Adjacent tier
                reasons.append('Tolerance compatible')
            
            # Pay amount (20% weight)
            pay = job.get('pay_amount', 0.0) or 0.0
            if pay > 500:
                score += 0.2
                reasons.append('High pay')
            elif pay > 200:
                score += 0.1
                reasons.append('Good pay')
            
            # Urgency (10% weight) - jobs with closer deadlines get slight boost
            deadline = job.get('deadline')
            if deadline:
                days_until = (deadline - datetime.now()).days
                if 0 < days_until <= 7:
                    score += 0.1
                    reasons.append('Urgent deadline')
            
            recommendations.append({
                'job_id': job.get('id'),
                'job_title': job.get('title'),
                'recommendation_score': score,
                'reasons': reasons,
                'job_data': job,
            })
        
        # Sort by score descending
        recommendations.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        # Limit and return
        return recommendations[:max_recommendations]


class RatingAggregator:
    """
    Rating Aggregation and Statistics
    
    Simple statistics: Average ratings, total counts, distribution.
    Can add Bayesian averaging or confidence intervals later.
    """
    
    @staticmethod
    def aggregate_ratings(ratings: List[Dict]) -> Dict[str, float]:
        """
        Aggregate ratings for a manufacturer or client
        
        Args:
            ratings: List of rating records with 'rating' field (1-5)
        
        Returns:
            Statistics: average, count, distribution
        """
        if not ratings:
            return {
                'average_rating': 0.0,
                'total_ratings': 0,
                'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            }
        
        rating_values = [r.get('rating', 0) for r in ratings if r.get('rating')]
        
        if not rating_values:
            return {
                'average_rating': 0.0,
                'total_ratings': 0,
                'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            }
        
        distribution = {i: 0 for i in range(1, 6)}
        for r in rating_values:
            if 1 <= r <= 5:
                distribution[int(r)] += 1
        
        return {
            'average_rating': statistics.mean(rating_values),
            'total_ratings': len(rating_values),
            'median_rating': statistics.median(rating_values),
            'rating_distribution': distribution,
            'rating_percentages': {
                i: (distribution[i] / len(rating_values) * 100)
                for i in range(1, 6)
            },
        }
    
    @staticmethod
    def calculate_bayesian_rating(
        ratings: List[Dict],
        prior_mean: float = 3.0,
        prior_count: float = 5.0
    ) -> float:
        """
        Calculate Bayesian average rating (prevents new users from having perfect 5.0)
        
        Formula: (prior_mean * prior_count + sum(ratings)) / (prior_count + count(ratings))
        """
        rating_values = [r.get('rating', 0) for r in ratings if r.get('rating')]
        if not rating_values:
            return prior_mean
        
        return (prior_mean * prior_count + sum(rating_values)) / (prior_count + len(rating_values))

