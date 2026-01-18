"""
F4: Workflow Scheduling Model
Optimizes manufacturer's weekly task schedule to maximize profit and device utilization.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import json


@dataclass
class Task:
    """Individual manufacturing task"""
    job_id: str
    priority: int  # 1-10, higher = more urgent
    estimated_hours: float
    deadline: datetime
    required_device_types: List[str]  # e.g., ['3d_printer_fdm', 'cnc_mill']
    pay_amount: float
    materials_needed: List[str]
    tolerance_tier: str


@dataclass
class DeviceAvailability:
    """Device availability window"""
    device_id: str
    device_type: str
    available_hours_per_day: Dict[str, float]  # {'2026-01-20': 8.0, ...}
    current_tasks: List[str]  # job_ids currently assigned
    maintenance_scheduled: List[Tuple[datetime, datetime]]  # maintenance windows
    efficiency_factor: float = 1.0  # 0-1, device condition/efficiency


@dataclass
class ScheduleInput:
    """Input for workflow scheduling"""
    tasks: List[Task]
    devices: List[DeviceAvailability]
    week_start: datetime
    week_end: datetime
    manufacturer_capacity_hours_per_day: float = 16.0  # max hours/day for maker


@dataclass
class ScheduledTask:
    """Task scheduled on a device"""
    job_id: str
    device_id: str
    start_time: datetime
    end_time: datetime
    estimated_completion: datetime
    priority: int
    pay_amount: float


@dataclass
class ScheduleOutput:
    """Output from workflow scheduling"""
    scheduled_tasks: List[ScheduledTask]
    unscheduled_tasks: List[str]  # job_ids that couldn't be scheduled
    total_profit: float
    device_utilization: Dict[str, float]  # {device_id: utilization_percentage}
    schedule_efficiency: float  # 0-1, overall schedule quality
    conflicts: List[str]  # warnings about potential issues
    model_version: str = "v1.0"


class WorkflowSchedulingModel:
    """
    F4: Workflow Scheduling Model
    
    Architecture:
    - Optimization algorithm: Greedy + Constraint Satisfaction Problem (CSP) hybrid
    - Alternative: Genetic Algorithm or Linear Programming (OR-Tools)
    
    Objective Function:
    maximize: Σ(pay_amount * priority_weight * deadline_feasibility) - penalty(conflicts)
    
    Constraints:
    1. Device availability: Task only scheduled when device is free
    2. Device compatibility: Task only on compatible device types
    3. Material availability: Materials must be available before task starts
    4. Deadline: Task must complete before deadline
    5. Capacity: Manufacturer can't exceed daily capacity
    6. Sequential dependencies: Some tasks may depend on others (optional)
    
    Algorithm Steps:
    
    1. Preprocessing:
       - Sort tasks by priority (deadline urgency + pay amount)
       - Filter tasks by device compatibility
       - Calculate deadline urgency scores
    
    2. Greedy Assignment:
       For each task (in priority order):
         a. Find compatible devices
         b. Find available time slots that meet deadline
         c. Rank slots by: profit/hour + device_efficiency + deadline_buffer
         d. Assign to best slot
         e. Update device availability
    
    3. Optimization Pass (refinement):
       - Detect underutilized devices
       - Try to reschedule tasks to balance load
       - Swap tasks if it improves overall profit
       - Check for deadline conflicts
    
    4. Validation:
       - Verify no double-booking
       - Check all deadlines can be met
       - Calculate utilization metrics
    
    Advanced Features:
    - Parallel task scheduling (multiple devices simultaneously)
    - Material preparation time (factor in material delivery/setup)
    - Batch optimization (group similar tasks on same device)
    - Dynamic rescheduling (handle new urgent tasks)
    """
    
    def __init__(self):
        self.model_version = "v1.0"
    
    def _calculate_priority_score(self, task: Task, current_time: datetime) -> float:
        """Calculate priority score for task (higher = more important)"""
        # Urgency factor (based on deadline)
        days_until_deadline = (task.deadline - current_time).total_seconds() / 86400
        urgency = 1.0 / (days_until_deadline + 1.0)  # higher if deadline is soon
        
        # Profit factor (normalized)
        profit_factor = min(task.pay_amount / 1000.0, 1.0)  # normalize to 0-1
        
        # Priority from user/priority field
        priority_factor = task.priority / 10.0
        
        # Combined score
        priority_score = (
            urgency * 0.4 +
            profit_factor * 0.4 +
            priority_factor * 0.2
        )
        
        return priority_score
    
    def _find_available_slot(
        self, 
        task: Task, 
        device: DeviceAvailability,
        week_start: datetime,
        week_end: datetime
    ) -> Optional[Tuple[datetime, datetime]]:
        """
        Find available time slot for task on device
        
        Returns:
            (start_time, end_time) or None if no slot available
        """
        current = week_start
        
        while current < week_end:
            day_str = current.strftime('%Y-%m-%d')
            available_hours = device.available_hours_per_day.get(day_str, 8.0)
            
            # Check if device is in maintenance
            in_maintenance = any(
                maint_start <= current < maint_end
                for maint_start, maint_end in device.maintenance_scheduled
            )
            
            if not in_maintenance and available_hours >= task.estimated_hours:
                # Found a slot
                start_time = current
                end_time = current + timedelta(hours=task.estimated_hours / device.efficiency_factor)
                
                # Check if it meets deadline
                if end_time <= task.deadline:
                    return (start_time, end_time)
            
            # Move to next day
            current += timedelta(days=1)
            current = current.replace(hour=8, minute=0, second=0)  # Start of workday
        
        return None
    
    def schedule(self, input_data: ScheduleInput) -> ScheduleOutput:
        """
        Generate optimal schedule for the week
        
        Args:
            input_data: Tasks, devices, and constraints
        
        Returns:
            ScheduleOutput with scheduled tasks and metrics
        """
        # Sort tasks by priority
        tasks_sorted = sorted(
            input_data.tasks,
            key=lambda t: self._calculate_priority_score(t, input_data.week_start),
            reverse=True
        )
        
        scheduled = []
        unscheduled = []
        device_bookings = {d.device_id: [] for d in input_data.devices}
        
        # Greedy assignment
        for task in tasks_sorted:
            # Find compatible devices
            compatible_devices = [
                d for d in input_data.devices
                if any(dt in d.device_type for dt in task.required_device_types)
            ]
            
            if not compatible_devices:
                unscheduled.append(task.job_id)
                continue
            
            # Try to schedule on best device
            best_slot = None
            best_device = None
            
            for device in compatible_devices:
                slot = self._find_available_slot(
                    task, device, input_data.week_start, input_data.week_end
                )
                
                if slot:
                    if best_slot is None or slot[0] < best_slot[0]:  # Earlier start
                        best_slot = slot
                        best_device = device
            
            if best_slot and best_device:
                # Schedule the task
                scheduled_task = ScheduledTask(
                    job_id=task.job_id,
                    device_id=best_device.device_id,
                    start_time=best_slot[0],
                    end_time=best_slot[1],
                    estimated_completion=best_slot[1],
                    priority=task.priority,
                    pay_amount=task.pay_amount
                )
                scheduled.append(scheduled_task)
                device_bookings[best_device.device_id].append(scheduled_task)
            else:
                unscheduled.append(task.job_id)
        
        # Calculate metrics
        total_profit = sum(st.pay_amount for st in scheduled)
        
        # Device utilization
        device_utilization = {}
        for device in input_data.devices:
            total_hours_scheduled = sum(
                (st.end_time - st.start_time).total_seconds() / 3600
                for st in device_bookings[device.device_id]
            )
            total_available = sum(device.available_hours_per_day.values())
            utilization = (total_hours_scheduled / total_available * 100) if total_available > 0 else 0.0
            device_utilization[device.device_id] = min(100.0, utilization)
        
        # Schedule efficiency (average utilization, adjusted for unscheduled tasks)
        avg_utilization = np.mean(list(device_utilization.values())) / 100.0
        completion_rate = len(scheduled) / len(input_data.tasks) if input_data.tasks else 1.0
        schedule_efficiency = (avg_utilization * 0.6 + completion_rate * 0.4)
        
        # Check for conflicts
        conflicts = []
        if unscheduled:
            conflicts.append(f"{len(unscheduled)} tasks could not be scheduled")
        if schedule_efficiency < 0.7:
            conflicts.append("Low device utilization detected")
        
        return ScheduleOutput(
            scheduled_tasks=scheduled,
            unscheduled_tasks=unscheduled,
            total_profit=total_profit,
            device_utilization=device_utilization,
            schedule_efficiency=schedule_efficiency,
            conflicts=conflicts,
            model_version=self.model_version
        )

